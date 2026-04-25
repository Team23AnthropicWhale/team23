<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Authenticate a user and issue a Sanctum API token.
 *
 * ---
 * POST /api/auth/login
 *
 * Request body (JSON):
 * {
 *   "email":       "caseworker@example.com",  // required
 *   "password":    "secret",                  // required
 *   "device_name": "Jane's iPhone"            // required — used to label the token
 * }
 *
 * Success — 200 OK:
 * {
 *   "token": "1|abc123...",
 *   "user": {
 *     "id": 1,
 *     "name": "Jane Doe",
 *     "email": "caseworker@example.com",
 *     "user_type": "case_worker"   // "case_worker" | "supervisor"
 *   }
 * }
 *
 * Failure — 422 Unprocessable Entity:
 * {
 *   "message": "The provided credentials are incorrect.",
 *   "errors": {
 *     "email": ["The provided credentials are incorrect."]
 *   }
 * }
 *
 * React Native usage:
 *   Store the returned token securely (e.g. expo-secure-store).
 *   Send it on every subsequent request as:
 *   Authorization: Bearer <token>
 */
class LoginController extends Controller
{
    public function __invoke(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        return response()->json([
            'token' => $user->createToken($request->device_name)->plainTextToken,
            'user' => new UserResource($user),
        ]);
    }
}
