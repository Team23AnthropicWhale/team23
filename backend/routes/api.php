<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\LogoutController;
use App\Http\Controllers\Auth\MeController;
use App\Http\Controllers\Cases\CaseController;
use App\Http\Controllers\Cases\Form1aController;
use App\Http\Controllers\Cases\Form1bController;
use App\Http\Controllers\Cases\Form2Controller;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Auth routes (public)
|--------------------------------------------------------------------------
| POST /api/auth/login  — issue a Sanctum token
*/
Route::prefix('auth')->group(function () {
    Route::post('login', LoginController::class)->name('auth.login');
});

/*
|--------------------------------------------------------------------------
| Auth routes (protected)
|--------------------------------------------------------------------------
| Requires: Authorization: Bearer <token>
*/
Route::prefix('auth')->middleware('auth:sanctum')->group(function () {
    Route::get('me', MeController::class)->name('auth.me');
    Route::post('logout', LogoutController::class)->name('auth.logout');
});

/*
|--------------------------------------------------------------------------
| Case routes (supervisor only)
|--------------------------------------------------------------------------
| Requires: Authorization: Bearer <token>  (supervisor account)
*/
Route::middleware(['auth:sanctum', 'supervisor'])->group(function () {
    Route::get('cases', [CaseController::class, 'index'])->name('cases.index');
    Route::post('cases', [CaseController::class, 'store'])->name('cases.store');
    Route::get('cases/{childCase}', [CaseController::class, 'show'])->name('cases.show');

    Route::prefix('cases/{childCase}')->group(function () {
        Route::get('form-1a', [Form1aController::class, 'show'])->name('cases.form-1a.show');
        Route::post('form-1a', [Form1aController::class, 'store'])->name('cases.form-1a.store');

        Route::get('form-1b', [Form1bController::class, 'show'])->name('cases.form-1b.show');
        Route::post('form-1b', [Form1bController::class, 'store'])->name('cases.form-1b.store');

        Route::get('form-2', [Form2Controller::class, 'show'])->name('cases.form-2.show');
        Route::post('form-2', [Form2Controller::class, 'store'])->name('cases.form-2.store');
    });
});
