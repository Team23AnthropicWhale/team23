<?php

namespace App\Http\Requests\Cases;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreForm1aRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            // Case information
            'date_completed' => ['required', 'date'],

            // Child personal details
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'other_names' => ['nullable', 'string', 'max:255'],

            // Consent basis
            'legal_basis' => ['required', Rule::in(['consent', 'vital_interests'])],
            'vital_interests_override' => ['required', 'boolean'],

            // Consent obtained from (conditional on vital_interests_override = false)
            'consent_from' => [Rule::when(! $this->boolean('vital_interests_override'), ['required']), 'array'],
            'consent_from.*' => [Rule::in(['child', 'one_parent_caregiver', 'both_parents_caregivers', 'other'])],
            'consent_other_relationship' => ['nullable', 'string', 'max:255'],
            'assent_from' => ['nullable', 'array'],
            'assent_from.*' => [Rule::in(['child', 'one_parent_caregiver', 'both_parents_caregivers', 'other'])],
            'assent_other_relationship' => ['nullable', 'string', 'max:255'],

            // Permissions granted
            'permission_participation' => ['required', 'boolean'],
            'permission_data_collection' => ['required', 'boolean'],
            'permission_data_sharing' => ['required', 'boolean'],
            'permission_reporting' => ['required', 'boolean'],
            'permission_tracing' => ['nullable', 'boolean'],

            // Withheld information
            'has_withheld_info' => ['required', 'boolean'],
            'withheld_info_detail' => [Rule::when($this->boolean('has_withheld_info'), ['required']), 'string'],
            'withheld_info_reason' => ['nullable', 'string'],

            // Authorization — child (optional)
            'child_name_auth' => ['nullable', 'string', 'max:255'],
            'child_date_auth' => ['nullable', 'date'],
            'child_signature' => ['nullable', 'string'],

            // Authorization — caregiver
            'caregiver_name_auth' => ['required', 'string', 'max:255'],
            'caregiver_date_auth' => ['required', 'date'],
            'caregiver_signature' => ['required', 'string'],

            // Authorization — caseworker
            'caseworker_name_auth' => ['required', 'string', 'max:255'],
            'caseworker_date_auth' => ['required', 'date'],
            'caseworker_signature' => ['required', 'string'],

            // Authorization — supervisor (optional)
            'supervisor_name_auth' => ['nullable', 'string', 'max:255'],
            'supervisor_date_auth' => ['nullable', 'date'],
            'supervisor_signature' => ['nullable', 'string'],
        ];
    }
}
