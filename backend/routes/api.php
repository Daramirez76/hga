<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\actividadesController;
use App\Http\Controllers\citasController;
use App\Http\Controllers\chatbotContextController;
use App\Http\Controllers\dashboardController;
use App\Http\Controllers\googleAuthController;
use App\Http\Controllers\informesController;
use App\Http\Controllers\medicamentosController;
use App\Http\Controllers\notificacionesController;
use App\Http\Controllers\olvideContrasenaController;
use App\Http\Controllers\registrarseController;
use App\Http\Controllers\residentesController;
use App\Http\Controllers\iniciarSesionController;
use App\Http\Controllers\visitasController;

// Test endpoint - simple response
Route::get('/test', function () {
    return response()->json(['success' => true, 'message' => 'Backend working!'], 200);
});
Route::get('/chatbot/context', [chatbotContextController::class, 'show'])->middleware(['auth.api']);
Route::get('/chatbot/viewer-context', [chatbotContextController::class, 'viewer'])->middleware(['auth.api']);

Route::get('/auth/google', [googleAuthController::class, 'redirectToGoogle'])
    ->name('auth.google');

Route::post('/register', [registrarseController::class, 'register']);
Route::post('/login', [iniciarSesionController::class, 'login']);
Route::post('/logout', [iniciarSesionController::class, 'logout'])->middleware(['auth.api', 'role:1,2,4']);
Route::get('/me', [iniciarSesionController::class, 'me'])->middleware(['auth.api', 'role:1,2,4']);
Route::put('/me', [iniciarSesionController::class, 'updateMe'])->middleware(['auth.api', 'role:1,2,4']);
Route::get('/tutores', [iniciarSesionController::class, 'tutores'])->middleware(['auth.api', 'role:1,2']);
Route::get('/dashboard', [dashboardController::class, 'index'])->middleware(['auth.api', 'role:1']);
Route::get('/notificaciones', [notificacionesController::class, 'index'])->middleware(['auth.api', 'role:1,2,4']);
Route::patch('/notificaciones/read-all', [notificacionesController::class, 'markAllAsRead'])->middleware(['auth.api', 'role:1,2,4']);
Route::patch('/notificaciones/{id}/read', [notificacionesController::class, 'markAsRead'])->middleware(['auth.api', 'role:1,2,4']);

Route::apiResource('/residentes', residentesController::class)
    ->only(['index', 'show'])
    ->middleware(['auth.api', 'role:1,2,4']);
Route::apiResource('/residentes', residentesController::class)
    ->only(['store', 'update', 'destroy'])
    ->middleware(['auth.api', 'role:1,2']);

Route::apiResource('/medicamentos', medicamentosController::class)
    ->middleware(['auth.api', 'role:1,2']);

// Endpoint específico para el calendario de visitas
Route::get('/visitas/calendar', [visitasController::class, 'calendar'])
    ->middleware(['auth.api', 'role:1,2,4']);

// Endpoint para obtener horarios disponibles
Route::get('/visitas/available-time-slots', [visitasController::class, 'availableTimeSlots'])
    ->middleware(['auth.api', 'role:1,2,4']);

Route::apiResource('/visitas', visitasController::class)
    ->only(['index', 'show'])
    ->middleware(['auth.api', 'role:1,2,4']);
Route::apiResource('/visitas', visitasController::class)
    ->only(['store', 'update', 'destroy'])
    ->middleware(['auth.api', 'role:1,2,4']);

Route::apiResource('/informes', informesController::class)
    ->middleware(['auth.api', 'role:1,2']);

Route::apiResource('/actividades', actividadesController::class)
    ->only(['index', 'show'])
    ->middleware(['auth.api', 'role:1,2,4']);
Route::apiResource('/actividades', actividadesController::class)
    ->only(['store', 'update', 'destroy'])
    ->middleware(['auth.api', 'role:1,2']);

Route::apiResource('/citas', citasController::class)
    ->only(['index', 'show'])
    ->middleware(['auth.api', 'role:1,2,4']);
Route::apiResource('/citas', citasController::class)
    ->only(['store', 'update', 'destroy'])
    ->middleware(['auth.api', 'role:1,2']);

// Ruta que Google llamará tras el login
Route::get('/auth/google/callback', [googleAuthController::class, 'handleGoogleCallback'])
    ->name('auth.google.callback');

// Legacy routes kept for backward compatibility with older frontend builds.
Route::post('/user/register', [registrarseController::class, 'register']);
Route::post('/user/login', [iniciarSesionController::class, 'login']);
Route::post('/user/logout', [iniciarSesionController::class, 'logout'])->middleware(['auth.api', 'role:1,2,4']);
Route::get('/user/me', [iniciarSesionController::class, 'me'])->middleware(['auth.api', 'role:1,2,4']);

Route::post('/user/forgot_password', [olvideContrasenaController::class, 'forgotPassword'])
    ->name('password.forgot.request');
Route::post('/user/forgot_password/reset', [olvideContrasenaController::class, 'resetPassword'])
    ->name('password.forgot.reset');
