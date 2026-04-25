<?php

namespace Database\Factories;

use App\Models\ChildCase;
use App\Models\Form1aSubmission;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Form1aSubmission>
 */
class Form1aSubmissionFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'case_id' => ChildCase::factory(),
            'date_completed' => fake()->date(),
            'first_name' => fake()->firstName(),
            'middle_name' => null,
            'last_name' => fake()->lastName(),
            'other_names' => null,
            'legal_basis' => fake()->randomElement(['consent', 'vital_interests']),
            'vital_interests_override' => false,
            'consent_from' => ['child', 'one_parent_caregiver'],
            'consent_other_relationship' => null,
            'assent_from' => ['child'],
            'assent_other_relationship' => null,
            'permission_participation' => true,
            'permission_data_collection' => true,
            'permission_data_sharing' => true,
            'permission_reporting' => true,
            'permission_tracing' => null,
            'has_withheld_info' => false,
            'withheld_info_detail' => null,
            'withheld_info_reason' => null,
            'child_name_auth' => null,
            'child_date_auth' => null,
            'child_signature' => null,
            'caregiver_name_auth' => fake()->name(),
            'caregiver_date_auth' => fake()->date(),
            'caregiver_signature' => 'data:image/png;base64,signature_placeholder',
            'caseworker_name_auth' => fake()->name(),
            'caseworker_date_auth' => fake()->date(),
            'caseworker_signature' => 'data:image/png;base64,signature_placeholder',
            'supervisor_name_auth' => null,
            'supervisor_date_auth' => null,
            'supervisor_signature' => null,
        ];
    }
}
