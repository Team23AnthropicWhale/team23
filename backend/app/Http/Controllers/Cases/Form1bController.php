<?php

namespace App\Http\Controllers\Cases;

use App\Http\Controllers\Controller;
use App\Http\Requests\Cases\StoreForm1bRequest;
use App\Http\Resources\Form1bSubmissionResource;
use App\Models\ChildCase;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

/**
 * Manage Form 1B (Registration and Rapid Assessment) submissions.
 *
 * ---
 * GET /api/cases/{case_id}/form-1b
 * Returns the Form 1B submission with household members, family members, and immediate needs.
 *
 * POST /api/cases/{case_id}/form-1b
 * Submits Form 1B for a case. Returns 422 if already submitted.
 * Body includes nested arrays for household_members, immediate_family_members, and immediate_needs.
 */
class Form1bController extends Controller
{
    public function show(ChildCase $childCase): Form1bSubmissionResource
    {
        $submission = $childCase->form1bSubmission()
            ->with(['householdMembers', 'familyMembers', 'immediateNeeds'])
            ->firstOrFail();

        return new Form1bSubmissionResource($submission);
    }

    public function store(StoreForm1bRequest $request, ChildCase $childCase): Response|JsonResponse
    {
        if ($childCase->form1bSubmission()->exists()) {
            return response()->json([
                'message' => 'Form 1B has already been submitted for this case.',
            ], 422);
        }

        $validated = $request->validated();
        $householdMembers = $validated['household_members'] ?? [];
        $immediateFamilyMembers = $validated['immediate_family_members'] ?? [];
        $immediateNeeds = $validated['immediate_needs'] ?? [];

        unset($validated['household_members'], $validated['immediate_family_members'], $validated['immediate_needs']);

        $submission = DB::transaction(function () use ($childCase, $validated, $householdMembers, $immediateFamilyMembers, $immediateNeeds) {
            $submission = $childCase->form1bSubmission()->create($validated);

            if (! empty($householdMembers)) {
                $submission->householdMembers()->createMany($householdMembers);
            }

            if (! empty($immediateFamilyMembers)) {
                $submission->familyMembers()->createMany($immediateFamilyMembers);
            }

            if (! empty($immediateNeeds)) {
                $submission->immediateNeeds()->createMany($immediateNeeds);
            }

            return $submission->load(['householdMembers', 'familyMembers', 'immediateNeeds']);
        });

        return (new Form1bSubmissionResource($submission))->response()->setStatusCode(201);
    }
}
