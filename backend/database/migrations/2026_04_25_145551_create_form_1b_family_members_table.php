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
        Schema::create('form_1b_family_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('form_1b_submission_id')->constrained('form_1b_submissions')->cascadeOnDelete();
            $table->string('full_name');
            $table->unsignedSmallInteger('age');
            $table->string('relationship');
            $table->string('address');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('form_1b_family_members');
    }
};
