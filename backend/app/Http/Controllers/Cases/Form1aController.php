<?php

namespace App\Http\Controllers\Cases;

use App\Http\Controllers\Controller;
use App\Http\Requests\Cases\StoreForm1aRequest;
use App\Http\Resources\Form1aSubmissionResource;
use App\Models\ChildCase;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

/**
 * Manage Form 1A (Consent and Assent) submissions.
 *
 * ---
 * GET /api/cases/{case_id}/form-1a
 * Returns the Form 1A submission for a case.
 *
 * POST /api/cases/{case_id}/form-1a
 * Submits Form 1A for a case. Returns 422 if already submitted.
 */
class Form1aController extends Controller
{
    public function show(ChildCase $childCase): Form1aSubmissionResource
    {
        $submission = $childCase->form1aSubmission()->firstOrFail();

        return new Form1aSubmissionResource($submission);
    }

    public function store(StoreForm1aRequest $request, ChildCase $childCase): Response|JsonResponse
    {
        if ($childCase->form1aSubmission()->exists()) {
            return response()->json([
                'message' => 'Form 1A has already been submitted for this case.',
            ], 422);
        }

        $submission = $childCase->form1aSubmission()->create($request->validated());

        return (new Form1aSubmissionResource($submission))->response()->setStatusCode(201);
    }
}
