<?php

use App\Models\ChildCase;
use App\Models\Form1aSubmission;
use App\Models\Form2Submission;
use App\Models\User;

test('unauthenticated cannot list cases', function () {
    $this->getJson('/api/cases')->assertUnauthorized();
});

test('caseworker cannot list cases', function () {
    $this->actingAs(User::factory()->caseWorker()->create(), 'sanctum')
        ->getJson('/api/cases')
        ->assertForbidden();
});

test('supervisor can list cases', function () {
    ChildCase::factory()->count(3)->create();

    $this->actingAs(User::factory()->supervisor()->create(), 'sanctum')
        ->getJson('/api/cases')
        ->assertOk()
        ->assertJsonStructure(['data' => [['id', 'case_id', 'created_at', 'updated_at', 'forms']]]);
});

test('listed cases are paginated', function () {
    ChildCase::factory()->count(3)->create();

    $this->actingAs(User::factory()->supervisor()->create(), 'sanctum')
        ->getJson('/api/cases')
        ->assertOk()
        ->assertJsonStructure(['data', 'meta', 'links']);
});

test('unauthenticated cannot create a case', function () {
    $this->postJson('/api/cases', ['case_id' => 'WAR-2024-001'])->assertUnauthorized();
});

test('caseworker cannot create a case', function () {
    $this->actingAs(User::factory()->caseWorker()->create(), 'sanctum')
        ->postJson('/api/cases', ['case_id' => 'WAR-2024-001'])
        ->assertForbidden();
});

test('supervisor can create a case', function () {
    $this->actingAs(User::factory()->supervisor()->create(), 'sanctum')
        ->postJson('/api/cases', ['case_id' => 'WAR-2024-001'])
        ->assertCreated()
        ->assertJsonPath('data.case_id', 'WAR-2024-001');

    expect(ChildCase::where('case_id', 'WAR-2024-001')->exists())->toBeTrue();
});

test('creating a case requires a case_id', function () {
    $this->actingAs(User::factory()->supervisor()->create(), 'sanctum')
        ->postJson('/api/cases', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['case_id']);
});

test('creating a case with a duplicate case_id returns 422', function () {
    ChildCase::factory()->create(['case_id' => 'WAR-2024-001']);

    $this->actingAs(User::factory()->supervisor()->create(), 'sanctum')
        ->postJson('/api/cases', ['case_id' => 'WAR-2024-001'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['case_id']);
});

test('unauthenticated cannot view a case', function () {
    $case = ChildCase::factory()->create();

    $this->getJson("/api/cases/{$case->case_id}")->assertUnauthorized();
});

test('caseworker cannot view a case', function () {
    $case = ChildCase::factory()->create();

    $this->actingAs(User::factory()->caseWorker()->create(), 'sanctum')
        ->getJson("/api/cases/{$case->case_id}")
        ->assertForbidden();
});

test('supervisor can view a case', function () {
    $case = ChildCase::factory()->create();

    $this->actingAs(User::factory()->supervisor()->create(), 'sanctum')
        ->getJson("/api/cases/{$case->case_id}")
        ->assertOk()
        ->assertJsonPath('data.case_id', $case->case_id);
});

test('case show includes forms object with null values when no forms submitted', function () {
    $case = ChildCase::factory()->create();

    $response = $this->actingAs(User::factory()->supervisor()->create(), 'sanctum')
        ->getJson("/api/cases/{$case->case_id}")
        ->assertOk();

    expect($response->json('data.forms'))->toHaveKeys(['form_1a', 'form_1b', 'form_2']);
});

test('case show includes submitted form data', function () {
    $case = ChildCase::factory()->create();
    Form1aSubmission::factory()->create(['case_id' => $case->id]);
    Form2Submission::factory()->create(['case_id' => $case->id]);

    $response = $this->actingAs(User::factory()->supervisor()->create(), 'sanctum')
        ->getJson("/api/cases/{$case->case_id}")
        ->assertOk();

    expect($response->json('data.forms.form_1a'))->not->toBeNull();
    expect($response->json('data.forms.form_2'))->not->toBeNull();
    expect($response->json('data.forms.form_1b'))->toBeNull();
});

test('viewing a non-existent case returns 404', function () {
    $this->actingAs(User::factory()->supervisor()->create(), 'sanctum')
        ->getJson('/api/cases/NONEXISTENT-CASE-ID')
        ->assertNotFound();
});
