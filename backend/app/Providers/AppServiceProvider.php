<?php

namespace App\Providers;

use App\Repositories\Eloquent\usuariosRepository;
use App\Repositories\Interfaces\usuariosInterface;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(usuariosInterface::class, usuariosRepository::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
