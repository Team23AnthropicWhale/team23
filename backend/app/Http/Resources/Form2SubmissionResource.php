<?php

namespace App\Http\Resources;

use App\Models\Form2Submission;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Form2Submission
 */
class Form2SubmissionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'case_id' => $this->case_id,
            'date_started' => $this->date_started,
            'date_completed' => $this->date_completed,
            'contact_type' => $this->contact_type,
            'who_present' => $this->who_present,
            'who_present_other' => $this->who_present_other,
            'is_reopened' => $this->is_reopened,
            'previous_closure_date' => $this->previous_closure_date,
            'safety' => $this->safety,
            'family_caregiving' => $this->family_caregiving,
            'physical_health' => $this->physical_health,
            'emotional_wellbeing' => $this->emotional_wellbeing,
            'education_status' => $this->education_status,
            'education_detail' => $this->education_detail,
            'friends_social' => $this->friends_social,
            'work' => $this->work,
            'legal_documentation' => $this->legal_documentation,
            'perpetrator_known' => $this->perpetrator_known,
            'perpetrator_type' => $this->perpetrator_type,
            'perpetrator_other' => $this->perpetrator_other,
            'incident_location_known' => $this->incident_location_known,
            'incident_location' => $this->incident_location,
            'incident_location_other' => $this->incident_location_other,
            'child_views_wishes' => $this->child_views_wishes,
            'child_seen_individually' => $this->child_seen_individually,
            'caregiver_views_wishes' => $this->caregiver_views_wishes,
            'risk_factors' => $this->risk_factors,
            'protective_factors' => $this->protective_factors,
            'additional_notes' => $this->additional_notes,
            'bid_required' => $this->bid_required,
            'caseworker_name' => $this->caseworker_name,
            'caseworker_date' => $this->caseworker_date,
            'caseworker_signature' => $this->caseworker_signature,
            'supervisor_name' => $this->supervisor_name,
            'supervisor_date' => $this->supervisor_date,
            'supervisor_signature' => $this->supervisor_signature,
            'supervisor_comments' => $this->supervisor_comments,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
