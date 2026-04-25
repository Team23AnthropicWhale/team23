<?php

namespace App\Http\Resources;

use App\Models\ChildCase;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin ChildCase
 */
class ChildCaseResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'case_id' => $this->case_id,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'forms' => [
                'form_1a' => $this->whenLoaded('form1aSubmission', fn () => new Form1aSubmissionResource($this->form1aSubmission)),
                'form_1b' => $this->whenLoaded('form1bSubmission', fn () => new Form1bSubmissionResource($this->form1bSubmission)),
                'form_2' => $this->whenLoaded('form2Submission', fn () => new Form2SubmissionResource($this->form2Submission)),
            ],
        ];
    }
}
