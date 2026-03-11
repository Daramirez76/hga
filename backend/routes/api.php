<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\googleAuthController;
use App\Http\Controllers\medicamentosController;
use App\Http\Controllers\olvideContrasenaController;
use App\Http\Controllers\registrarseController;
use App\Http\Controllers\residentesController;
use App\Http\Controllers\iniciarSesionController;
use App\Http\Controllers\visitasController;

// Test endpoint - simple response
Route::get('/test', function () {
    return response()->json(['success' => true, 'message' => 'Backend working!'], 200);
});

Route::post('/register', [registrarseController::class, 'register']);
Route::post('/login', [iniciarSesionController::class, 'login']);
Route::post('/logout', [iniciarSesionController::class, 'logout'])->middleware('auth.api');
Route::get('/me', [iniciarSesionController::class, 'me'])->middleware('auth.api');
Route::resource('residentes', residentesController::class)->middleware('auth.api');
Route::resource('medicamentos', medicamentosController::class)->middleware('auth.api');
Route::resource('visitas', visitasController::class)->middleware('auth.api');
Route::resource('informes', informesController::class)->middleware('auth.api');
Route::resource('actividades', actividadesController::class)->middleware('auth.api');
Route::resource('citas', citasController::class)->middleware('auth.api');

// Ruta que Google llamará tras el login
Route::get('/auth/google/callback', [googleAuthController::class, 'handleGoogleCallback'])
    ->name('auth.google.callback');

// Legacy routes kept for backward compatibility with older frontend builds.
Route::post('/user/register', [registrarseController::class, 'register']);
Route::post('/user/login', [iniciarSesionController::class, 'login']);
Route::post('/user/logout', [iniciarSesionController::class, 'logout'])->middleware('auth.api');
Route::get('/user/me', [iniciarSesionController::class, 'me'])->middleware('auth.api');

Route::post('/user/forgot_password', [olvideContrasenaController::class, 'forgotPassword'])
    ->name('password.forgot.request');
Route::post('/user/forgot_password/reset', [olvideContrasenaController::class, 'resetPassword'])
    ->name('password.forgot.reset');
