<?php

use App\Models\ChildCase;
use App\Models\Form1aSubmission;
use App\Models\User;

function validForm1aData(): array
{
    return [
        'date_completed' => '2024-01-15',
        'first_name' => 'John',
        'last_name' => 'Doe',
        'legal_basis' => 'consent',
        'vital_interests_override' => false,
        'consent_from' => ['child', 'one_parent_caregiver'],
        'permission_participation' => true,
        'permission_data_collection' => true,
        'permission_data_sharing' => true,
        'permission_reporting' => true,
        'has_withheld_info' => false,
        'caregiver_name_auth' => 'Jane Doe',
        'caregiver_date_auth' => '2024-01-15',
        'caregiver_signature' => 'data:image/png;base64,abc123',
        'caseworker_name_auth' => 'Alice Worker',
        'caseworker_date_auth' => '2024-01-15',
        'caseworker_signature' => 'data:image/png;base64,def456',
    ];
}

test('unauthenticated cannot submit form 1a', function () {
    $case = ChildCase::factory()->create();

    $this->postJson("/api/cases/{$case->case_id}/form-1a", validForm1aData())->assertUnauthorized();
});

test('caseworker cannot submit form 1a', function () {
    $case = ChildCase::factory()->create();

    $this->actingAs(User::factory()->caseWorker()->create(), 'sanctum')
        ->postJson("/api/cases/{$case->case_id}/form-1a", validForm1aData())
        ->assertForbidden();
});

test('supervisor can submit form 1a', function () {
    $case = ChildCase::factory()->create();

    $this->actingAs(User::factory()->supervisor()->create(), 'sanctum')
        ->postJson("/api/cases/{$case->case_id}/form-1a", validForm1aData())
        ->assertCreated()
        ->assertJsonStructure(['data' => ['id', 'case_id', 'first_name', 'last_name', 'legal_basis']]);

    expect(Form1aSubmission::where('case_id', $case->id)->exists())->toBeTrue();
});

test('submitting form 1a twice returns 422', function () {
    $case = ChildCase::factory()->create();
    Form1aSubmission::factory()->create(['case_id' => $case->id]);

    $this->actingAs(User::factory()->supervisor()->create(), 'sanctum')
        ->postJson("/api/cases/{$case->case_id}/form-1a", validForm1aData())
        ->assertUnprocessable()
        ->assertJsonPath('message', 'Form 1A has already been submitted for this case.');
});

test('form 1a validates required fields', function (string $field) {
    $case = ChildCase::factory()->create();
    $payload = validForm1aData();
    unset($payload[$field]);

    $this->actingAs(User::factory()->supervisor()->create(), 'sanctum')
        ->postJson("/api/cases/{$case->case_id}/form-1a", $payload)
        ->assertUnprocessable()
        ->assertJsonValidationErrors([$field]);
})->with([
    'date_completed',
    'first_name',
    'last_name',
    'legal_basis',
    'vital_interests_override',
    'permission_participation',
    'permission_data_collection',
    'permission_data_sharing',
    'permission_reporting',
    'has_withheld_info',
    'caregiver_name_auth',
    'caregiver_date_auth',
    'caregiver_signature',
    'caseworker_name_auth',
    'caseworker_date_auth',
    'caseworker_signature',
]);

test('form 1a legal_basis must be a valid option', function () {
    $case = ChildCase::factory()->create();

    $this->actingAs(User::factory()->supervisor()->create(), 'sanctum')
        ->postJson("/api/cases/{$case->case_id}/form-1a", array_merge(validForm1aData(), ['legal_basis' => 'invalid']))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['legal_basis']);
});

test('form 1a consent_from is required when vital_interests_override is false', function () {
    $case = ChildCase::factory()->create();

    $this->actingAs(User::factory()->supervisor()->create(), 'sanctum')
        ->postJson("/api/cases/{$case->case_id}/form-1a", array_merge(validForm1aData(), [
            'vital_interests_override' => false,
            'consent_from' => null,
        ]))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['consent_from']);
});

test('form 1a withheld_info_detail is required when has_withheld_info is true', function () {
    $case = ChildCase::factory()->create();

    $this->actingAs(User::factory()->supervisor()->create(), 'sanctum')
        ->postJson("/api/cases/{$case->case_id}/form-1a", array_merge(validForm1aData(), [
            'has_withheld_info' => true,
            'withheld_info_detail' => null,
        ]))
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['withheld_info_detail']);
});

test('unauthenticated cannot view form 1a', function () {
    $case = ChildCase::factory()->create();

    $this->getJson("/api/cases/{$case->case_id}/form-1a")->assertUnauthorized();
});

test('supervisor can view form 1a submission', function () {
    $case = ChildCase::factory()->create();
    $submission = Form1aSubmission::factory()->create(['case_id' => $case->id]);

    $this->actingAs(User::factory()->supervisor()->create(), 'sanctum')
        ->getJson("/api/cases/{$case->case_id}/form-1a")
        ->assertOk()
        ->assertJsonPath('data.id', $submission->id)
        ->assertJsonPath('data.first_name', $submission->first_name);
});

test('viewing form 1a for case without submission returns 404', function () {
    $case = ChildCase::factory()->create();

    $this->actingAs(User::factory()->supervisor()->create(), 'sanctum')
        ->getJson("/api/cases/{$case->case_id}/form-1a")
        ->assertNotFound();
});

test('form 1a submission is scoped to the correct case', function () {
    $caseA = ChildCase::factory()->create();
    $caseB = ChildCase::factory()->create();
    Form1aSubmission::factory()->create(['case_id' => $caseA->id]);

    $this->actingAs(User::factory()->supervisor()->create(), 'sanctum')
        ->getJson("/api/cases/{$caseB->case_id}/form-1a")
        ->assertNotFound();
});
