<?php

namespace App\Http\Resources;

use App\Models\Form1aSubmission;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Form1aSubmission
 */
class Form1aSubmissionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'case_id' => $this->case_id,
            'date_completed' => $this->date_completed,
            'first_name' => $this->first_name,
            'middle_name' => $this->middle_name,
            'last_name' => $this->last_name,
            'other_names' => $this->other_names,
            'legal_basis' => $this->legal_basis,
            'vital_interests_override' => $this->vital_interests_override,
            'consent_from' => $this->consent_from,
            'consent_other_relationship' => $this->consent_other_relationship,
            'assent_from' => $this->assent_from,
            'assent_other_relationship' => $this->assent_other_relationship,
            'permission_participation' => $this->permission_participation,
            'permission_data_collection' => $this->permission_data_collection,
            'permission_data_sharing' => $this->permission_data_sharing,
            'permission_reporting' => $this->permission_reporting,
            'permission_tracing' => $this->permission_tracing,
            'has_withheld_info' => $this->has_withheld_info,
            'withheld_info_detail' => $this->withheld_info_detail,
            'withheld_info_reason' => $this->withheld_info_reason,
            'child_name_auth' => $this->child_name_auth,
            'child_date_auth' => $this->child_date_auth,
            'child_signature' => $this->child_signature,
            'caregiver_name_auth' => $this->caregiver_name_auth,
            'caregiver_date_auth' => $this->caregiver_date_auth,
            'caregiver_signature' => $this->caregiver_signature,
            'caseworker_name_auth' => $this->caseworker_name_auth,
            'caseworker_date_auth' => $this->caseworker_date_auth,
            'caseworker_signature' => $this->caseworker_signature,
            'supervisor_name_auth' => $this->supervisor_name_auth,
            'supervisor_date_auth' => $this->supervisor_date_auth,
            'supervisor_signature' => $this->supervisor_signature,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
