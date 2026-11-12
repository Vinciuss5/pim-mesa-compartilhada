// Arquivo de build raiz do projeto.
// Os plugins são declarados aqui (com apply false) e aplicados no módulo :app.
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
}
