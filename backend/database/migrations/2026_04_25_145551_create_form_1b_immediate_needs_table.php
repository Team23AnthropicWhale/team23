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
        Schema::create('form_1b_immediate_needs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('form_1b_submission_id')->constrained('form_1b_submissions')->cascadeOnDelete();
            $table->enum('category', ['health', 'safety', 'care', 'other']);
            $table->string('category_other')->nullable();
            $table->text('summary_reasons');
            $table->text('action_taken');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('form_1b_immediate_needs');
    }
};
