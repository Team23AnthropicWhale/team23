<?php

namespace App\Http\Controllers\Cases;

use App\Http\Controllers\Controller;
use App\Http\Requests\Cases\StoreCaseRequest;
use App\Http\Resources\ChildCaseResource;
use App\Models\ChildCase;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

/**
 * Manage WarChild cases.
 *
 * ---
 * GET /api/cases
 * Returns a paginated list of all cases with form submission status.
 *
 * POST /api/cases
 * Creates a new case.
 * Body: { "case_id": "WAR-2024-001" }
 *
 * GET /api/cases/{case_id}
 * Returns a single case with all submitted forms.
 */
class CaseController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $cases = ChildCase::with(['form1aSubmission', 'form1bSubmission', 'form2Submission'])
            ->latest()
            ->paginate(25);

        return ChildCaseResource::collection($cases);
    }

    public function store(StoreCaseRequest $request): Response|JsonResponse
    {
        $childCase = ChildCase::create($request->validated());

        return (new ChildCaseResource($childCase))->response()->setStatusCode(201);
    }

    public function show(ChildCase $childCase): ChildCaseResource
    {
        $childCase->load([
            'form1aSubmission',
            'form1bSubmission.householdMembers',
            'form1bSubmission.familyMembers',
            'form1bSubmission.immediateNeeds',
            'form2Submission',
        ]);

        return new ChildCaseResource($childCase);
    }
}
