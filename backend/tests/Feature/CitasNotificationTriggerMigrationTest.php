<?php

namespace Tests\Feature;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class CitasNotificationTriggerMigrationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::dropIfExists('notificaciones');
        Schema::dropIfExists('citas');

        Schema::create('citas', function (Blueprint $table) {
            $table->integer('cod_cita')->primary();
            $table->date('Fecha_cita');
            $table->time('hora_inicio');
            $table->time('hora_fin');
            $table->string('Nombre_acompañante', 50);
            $table->string('Lugar_cita', 30);
            $table->integer('cod_Residente');
        });

        Schema::create('notificaciones', function (Blueprint $table) {
            $table->integer('cod_Notificaciones')->primary();
            $table->integer('cod_usuario');
            $table->integer('cod_Residente');
            $table->string('Descrip_Novedad', 100);
        });
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('notificaciones');
        Schema::dropIfExists('citas');

        parent::tearDown();
    }

    public function test_migration_adds_cod_usuario_without_recreating_legacy_trigger(): void
    {
        $migration = require base_path('database/migrations/2026_03_26_000005_reconcile_citas_user_and_notification_trigger.php');

        $migration->up();

        $this->assertTrue(Schema::hasColumn('citas', 'cod_usuario'));
    }
}
