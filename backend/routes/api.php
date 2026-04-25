<?php

use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\LogoutController;
use App\Http\Controllers\Auth\MeController;
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
