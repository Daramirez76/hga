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
        if (Schema::hasTable('citas')) {
            return;
        }

        Schema::create('citas', function (Blueprint $table) {
            $table->integer('cod_cita')->primary();
            $table->date('Fecha_cita');
            $table->time('hora_inicio');
            $table->time('hora_fin');
            $table->string('Nombre_acompañante', 50);
            $table->string('Lugar_cita', 30);
            $table->integer('cod_Residente');
            $table->integer('cod_usuario')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('citas');
    }
};
