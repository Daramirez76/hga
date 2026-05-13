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
        if (Schema::hasTable('actividades_ludicas') || Schema::hasTable('_actividades')) {
            return;
        }

        Schema::create('actividades_ludicas', function (Blueprint $table) {
            $table->integer('Cod_acti_ludi')->primary();
            $table->string('Nombre', 50);
            $table->date('Fecha');
            $table->time('Hora_ini');
            $table->time('Hora_fin');
            $table->integer('cod_residente');
            $table->integer('cod_rol');
            $table->string('Lugar', 50);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('actividades_ludicas');
    }
};
