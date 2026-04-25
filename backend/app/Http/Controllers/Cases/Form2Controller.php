<?php

namespace App\Http\Controllers\Cases;

use App\Http\Controllers\Controller;
use App\Http\Requests\Cases\StoreForm2Request;
use App\Http\Resources\Form2SubmissionResource;
use App\Models\ChildCase;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;

/**
 * Manage Form 2 (Comprehensive Assessment) submissions.
 *
 * ---
 * GET /api/cases/{case_id}/form-2
 * Returns the Form 2 submission for a case.
 *
 * POST /api/cases/{case_id}/form-2
 * Submits Form 2 for a case. Returns 422 if already submitted.
 */
class Form2Controller extends Controller
{
    public function show(ChildCase $childCase): Form2SubmissionResource
    {
        $submission = $childCase->form2Submission()->firstOrFail();

        return new Form2SubmissionResource($submission);
    }

    public function store(StoreForm2Request $request, ChildCase $childCase): Response|JsonResponse
    {
        if ($childCase->form2Submission()->exists()) {
            return response()->json([
                'message' => 'Form 2 has already been submitted for this case.',
            ], 422);
        }

        $submission = $childCase->form2Submission()->create($request->validated());

        return (new Form2SubmissionResource($submission))->response()->setStatusCode(201);
    }
}
