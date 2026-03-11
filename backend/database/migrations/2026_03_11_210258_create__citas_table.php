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
        Schema::create('_citas', function (Blueprint $table) {
            $table->id();
            $table->integer('cod_cita')->unique();
            $table->date('Fecha_cita');
            $table->time('hora_inicio');
            $table->time('hora_fin');
            $table->string('Nombre_acompañante', 50);
            $table->string('Lugar_cita', 100);
            $table->integer('cod_Residente');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('_citas');
    }
};
