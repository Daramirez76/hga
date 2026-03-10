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
        Schema::create('medicamento', function (Blueprint $table) {
            $table->id();
            $table->integer('cod_medicamento')->unique();
            $table->string('nombre_medic', 10);
            $table->date('fecha_entrada');
            $table->date('fecha_vencimiento');
            $table->integer('cod_usuario');
            $table->integer('cod_residente');
            $table->integer('cod_rol');
            $table->string('descrip_novedad', 100);
            $table->date('fecha_novedad');
            $table->integer('stock');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('medicamento');
    }
};
