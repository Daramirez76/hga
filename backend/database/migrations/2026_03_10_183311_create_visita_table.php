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
        Schema::create('visita', function (Blueprint $table) {
            $table->id();
            $table->integer('cod_Visitas')->unique();
            $table->integer('doc_id');
            $table->string('Nomb_visitante', 50);
            $table->integer('cod_Residente');
            $table->date('Fecha_Visita');
            $table->integer('cod_usuario');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('visita');
    }
};
