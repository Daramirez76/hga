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
        Schema::create('_actividades', function (Blueprint $table) {
            $table->id();
            $table->integer('Cod_acti_ludi')->unique();
            $table->integer('doc_id')->nullable();
            $table->string('Nombre');
            $table->date('Fecha');
            $table->time('Hora_ini');
            $table->time('Hora_fin');
            $table->integer('cod_residente');
            $table->integer('cod_rol');
            $table->string('Lugar');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('_actividades');
    }
};
