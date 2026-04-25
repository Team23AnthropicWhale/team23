<?php

namespace Database\Factories;

use App\Models\Form1bImmediateNeed;
use App\Models\Form1bSubmission;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Form1bImmediateNeed>
 */
class Form1bImmediateNeedFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'form_1b_submission_id' => Form1bSubmission::factory(),
            'category' => fake()->randomElement(['health', 'safety', 'care', 'other']),
            'category_other' => null,
            'summary_reasons' => fake()->paragraph(),
            'action_taken' => fake()->paragraph(),
        ];
    }
}
