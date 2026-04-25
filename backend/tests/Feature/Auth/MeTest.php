<?php

use App\Enums\UserType;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

test('me returns the authenticated user', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $this->getJson('/api/auth/me')
        ->assertOk()
        ->assertJsonStructure([
            'data' => [
                'id',
                'name',
                'email',
                'user_type'
            ]
        ]);
});

test('me returns the correct user data', function () {
    $user = User::factory()->caseWorker()->create();
    Sanctum::actingAs($user);

    $this->getJson('/api/auth/me')
        ->assertOk()
        ->assertJson([
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'user_type' => UserType::CASEWORKER->value,
            ],
        ]);
});

test('me returns supervisor user_type for supervisors', function () {
    Sanctum::actingAs(User::factory()->supervisor()->create());

    $response = $this->getJson('/api/auth/me')->assertOk();

    expect($response->json('data.user_type'))->toBe(UserType::SUPERVISOR->value);
});

test('me returns 401 without a token', function () {
    $this->getJson('/api/auth/me')->assertUnauthorized();
});
