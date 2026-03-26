<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('notificaciones_sistema')) {
            return;
        }

        Schema::create('notificaciones_sistema', function (Blueprint $table) {
            $table->id();
            $table->integer('recipient_doc_id')->index();
            $table->integer('actor_doc_id')->nullable()->index();
            $table->string('module', 50)->index();
            $table->string('event', 50)->index();
            $table->unsignedBigInteger('entity_id')->nullable()->index();
            $table->integer('cod_residente')->nullable()->index();
            $table->string('title', 120);
            $table->text('message');
            $table->timestamp('read_at')->nullable()->index();
            $table->json('meta')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notificaciones_sistema');
    }
};
