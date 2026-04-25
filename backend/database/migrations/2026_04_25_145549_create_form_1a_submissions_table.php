<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('form_1a_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('case_id')->constrained('cases')->cascadeOnDelete();
            $table->date('date_completed');

            // Child personal details
            $table->string('first_name');
            $table->string('middle_name')->nullable();
            $table->string('last_name');
            $table->string('other_names')->nullable();

            // Consent basis
            $table->enum('legal_basis', ['consent', 'vital_interests']);
            $table->boolean('vital_interests_override');

            // Consent and assent obtained from (multiselect, conditional on vital_interests_override = false)
            $table->json('consent_from')->nullable();
            $table->string('consent_other_relationship')->nullable();
            $table->json('assent_from')->nullable();
            $table->string('assent_other_relationship')->nullable();

            // Permissions granted
            $table->boolean('permission_participation');
            $table->boolean('permission_data_collection');
            $table->boolean('permission_data_sharing');
            $table->boolean('permission_reporting');
            $table->boolean('permission_tracing')->nullable();

            // Withheld information
            $table->boolean('has_withheld_info');
            $table->text('withheld_info_detail')->nullable();
            $table->text('withheld_info_reason')->nullable();

            // Authorization — child (optional)
            $table->string('child_name_auth')->nullable();
            $table->date('child_date_auth')->nullable();
            $table->text('child_signature')->nullable();

            // Authorization — caregiver
            $table->string('caregiver_name_auth');
            $table->date('caregiver_date_auth');
            $table->text('caregiver_signature');

            // Authorization — caseworker
            $table->string('caseworker_name_auth');
            $table->date('caseworker_date_auth');
            $table->text('caseworker_signature');

            // Authorization — supervisor (optional)
            $table->string('supervisor_name_auth')->nullable();
            $table->date('supervisor_date_auth')->nullable();
            $table->text('supervisor_signature')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('form_1a_submissions');
    }
};
