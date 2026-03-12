import { NextRequest, NextResponse } from 'next/server';
import { getConvexClient, getAuthenticatedConvexClient, api, isConvexConfigured } from '@/lib/convex/client';
import { listTemplates } from '@/lib/workflow/templates';

export const dynamic = 'force-dynamic';

function mapWorkflow(w: any) {
  return {
    id: w.customId || w._id,
    name: w.name,
    description: w.description,
    category: w.category,
    tags: w.tags,
    difficulty: w.difficulty,
    estimatedTime: w.estimatedTime,
    nodes: w.nodes,
    edges: w.edges,
    createdAt: w.createdAt,
    updatedAt: w.updatedAt,
    nodeCount: w.nodes?.length || 0,
    edgeCount: w.edges?.length || 0,
  };
}

/**
 * GET /api/workflows - List all workflows
 * Uses Convex for storage and gracefully falls back when auth token retrieval fails.
 */
export async function GET(_request: NextRequest) {
  try {
    if (!isConvexConfigured()) {
      return NextResponse.json({
        workflows: [],
        total: 0,
        source: 'none',
        message: 'Convex not configured. Add NEXT_PUBLIC_CONVEX_URL to .env.local',
      });
    }

    try {
      const authedConvex = await getAuthenticatedConvexClient();
      const authedWorkflows = await authedConvex.query(api.workflows.listWorkflows, {});

      return NextResponse.json({
        workflows: authedWorkflows.map(mapWorkflow),
        total: authedWorkflows.length,
        source: 'convex-auth',
      });
    } catch (authError) {
      // Auth failed (e.g. missing Clerk JWT template). Try unauthenticated.
    }

    try {
      const convex = getConvexClient();
      const workflows = await convex.query(api.workflows.listWorkflows, {});
      return NextResponse.json({
        workflows: workflows.map(mapWorkflow),
        total: workflows.length,
        source: 'convex-fallback',
      });
    } catch {
      // Convex dev server not running — fall through to local templates.
    }

    const local = listTemplates();
    return NextResponse.json({ workflows: local, total: local.length, source: 'local-templates' });
  } catch (error) {
    console.warn('Unexpected error in GET /api/workflows, serving local templates:', error instanceof Error ? error.message : error);
    const local = listTemplates();
    return NextResponse.json({
      workflows: local,
      total: local.length,
      source: 'local-templates',
    });
  }
}

/**
 * POST /api/workflows - Save a workflow to Convex
 */
export async function POST(request: NextRequest) {
  try {
    let workflow;
    try {
      const body = await request.text();
      if (!body || body.trim() === '') {
        return NextResponse.json(
          { error: 'Request body is empty' },
          { status: 400 }
        );
      }
      workflow = JSON.parse(body);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    if (!workflow.id && !workflow.name) {
      return NextResponse.json(
        { error: 'Workflow must have either id or name' },
        { status: 400 }
      );
    }

    if (!isConvexConfigured()) {
      return NextResponse.json({
        success: false,
        message: 'Convex not configured. Add NEXT_PUBLIC_CONVEX_URL to .env.local',
      }, { status: 500 });
    }

    // Validate workflow has required fields
    if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
      return NextResponse.json(
        { error: 'Workflow must have a nodes array' },
        { status: 400 }
      );
    }

    if (!workflow.edges || !Array.isArray(workflow.edges)) {
      return NextResponse.json(
        { error: 'Workflow must have an edges array' },
        { status: 400 }
      );
    }

    const convex = await getAuthenticatedConvexClient();

    // Use workflow.id as customId for Convex
    const customId = workflow.id || `workflow_${Date.now()}`;

    const savedId = await convex.mutation(api.workflows.saveWorkflow, {
      customId,
      name: workflow.name || 'Untitled Workflow',
      description: workflow.description,
      category: workflow.category,
      tags: workflow.tags,
      difficulty: workflow.difficulty,
      estimatedTime: workflow.estimatedTime,
      nodes: workflow.nodes,
      edges: workflow.edges,
      version: workflow.version,
      isTemplate: workflow.isTemplate,
    });

    return NextResponse.json({
      success: true,
      workflowId: savedId,
      source: 'convex',
      message: 'Workflow saved successfully',
    });
  } catch (error) {
    console.error('Error saving workflow:', error);
    return NextResponse.json(
      {
        error: 'Failed to save workflow',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workflows?id=xxx - Delete a workflow from Convex
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('id');

    if (!workflowId) {
      return NextResponse.json(
        { error: 'Workflow ID is required' },
        { status: 400 }
      );
    }

    if (!isConvexConfigured()) {
      return NextResponse.json({
        success: false,
        message: 'Convex not configured',
      }, { status: 500 });
    }

    const convex = await getAuthenticatedConvexClient();

    // Look up workflow by customId first, then try Convex ID
    let workflow = await convex.query(api.workflows.getWorkflowByCustomId, {
      customId: workflowId,
    });

    // If not found and looks like Convex ID, try direct lookup
    if (!workflow && workflowId.startsWith('j')) {
      try {
        workflow = await convex.query(api.workflows.getWorkflow, {
          id: workflowId as any,
        });
      } catch (e) {
        // Not a valid Convex ID
      }
    }

    if (!workflow) {
      return NextResponse.json(
        { error: `Workflow ${workflowId} not found` },
        { status: 404 }
      );
    }

    // Delete using Convex ID
    await convex.mutation(api.workflows.deleteWorkflow, {
      id: workflow._id,
    });

    return NextResponse.json({
      success: true,
      source: 'convex',
      message: 'Workflow deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting workflow:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete workflow',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

