<?php

use App\Models\User;
use Laravel\Sanctum\Sanctum;

test('logout revokes the current token and returns 204', function () {
    $user = User::factory()->create();
    Sanctum::actingAs($user);

    $this->postJson('/api/auth/logout')->assertNoContent();
});

test('logout revokes only the current token', function () {
    $user = User::factory()->create();
    $token = $user->createToken('device-one')->plainTextToken;
    $user->createToken('device-two');

    $this->withToken($token)
        ->postJson('/api/auth/logout')
        ->assertNoContent();

    expect($user->tokens()->count())->toBe(1);
});

test('logout returns 401 without a token', function () {
    $this->postJson('/api/auth/logout')->assertUnauthorized();
});
