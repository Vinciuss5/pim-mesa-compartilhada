# Regras do ProGuard/R8 para o app Mesa Compartilhada.

# Mantém as anotações e assinaturas usadas pelo Retrofit/Gson.
-keepattributes Signature, *Annotation*, InnerClasses, EnclosingMethod

# Gson usa reflexão para mapear JSON -> data classes.
-keep class br.org.mesacompartilhada.app.data.model.** { *; }
-keep class com.google.gson.reflect.TypeToken
-keep class * extends com.google.gson.reflect.TypeToken

# Retrofit
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**
-keepattributes RuntimeVisibleAnnotations, RuntimeVisibleParameterAnnotations
-keepclassmembers,allowshrinking,allowobfuscation interface * {
    @retrofit2.http.* <methods>;
}
