<?php

namespace Database\Factories;

use App\Enums\UserType;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected static ?string $password;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
            'user_type' => fake()->randomElement(UserType::cases()),
        ];
    }

    public function supervisor(): static
    {
        return $this->state(['user_type' => UserType::SUPERVISOR]);
    }

    public function caseWorker(): static
    {
        return $this->state(['user_type' => UserType::CASEWORKER]);
    }

    public function unverified(): static
    {
        return $this->state(['email_verified_at' => null]);
    }
}
