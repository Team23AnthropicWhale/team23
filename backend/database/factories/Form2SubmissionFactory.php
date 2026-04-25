<?php

namespace Database\Factories;

use App\Models\ChildCase;
use App\Models\Form2Submission;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Form2Submission>
 */
class Form2SubmissionFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'case_id' => ChildCase::factory(),
            'date_started' => fake()->date(),
            'date_completed' => fake()->date(),
            'contact_type' => fake()->randomElement(['home_visit', 'meeting_other_location', 'phone_call', 'other']),
            'who_present' => ['child', 'parent_caregiver'],
            'who_present_other' => null,
            'is_reopened' => false,
            'previous_closure_date' => null,
            'safety' => fake()->paragraph(),
            'family_caregiving' => fake()->paragraph(),
            'physical_health' => fake()->paragraph(),
            'emotional_wellbeing' => fake()->paragraph(),
            'education_status' => fake()->randomElement(['no_learning', 'formal_education', 'other_learning']),
            'education_detail' => null,
            'friends_social' => fake()->paragraph(),
            'work' => fake()->sentence(),
            'legal_documentation' => fake()->sentence(),
            'perpetrator_known' => null,
            'perpetrator_type' => null,
            'perpetrator_other' => null,
            'incident_location_known' => null,
            'incident_location' => null,
            'incident_location_other' => null,
            'child_views_wishes' => fake()->paragraph(),
            'child_seen_individually' => true,
            'caregiver_views_wishes' => fake()->paragraph(),
            'risk_factors' => fake()->paragraph(),
            'protective_factors' => fake()->paragraph(),
            'additional_notes' => null,
            'bid_required' => false,
            'caseworker_name' => fake()->name(),
            'caseworker_date' => fake()->date(),
            'caseworker_signature' => 'data:image/png;base64,signature_placeholder',
            'supervisor_name' => fake()->name(),
            'supervisor_date' => fake()->date(),
            'supervisor_signature' => 'data:image/png;base64,signature_placeholder',
            'supervisor_comments' => null,
        ];
    }
}
