package br.org.mesacompartilhada.app.core

import java.time.Instant
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

/**
 * Utilitários de formatação e máscara, espelhando as funções do front web.
 */
object Formatters {

    private val zone: ZoneId = ZoneId.systemDefault()
    private val formatoBR: DateTimeFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy")
    private val formatoBRHora: DateTimeFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")

    /** Remove tudo que não for dígito. */
    fun somenteDigitos(valor: String?): String = valor?.filter { it.isDigit() } ?: ""

    /** Aplica máscara de CPF: 000.000.000-00. */
    fun formatarCpf(valor: String?): String {
        val digitos = somenteDigitos(valor).take(11)
        if (digitos.isEmpty()) return ""
        val sb = StringBuilder()
        for (i in digitos.indices) {
            when (i) {
                3, 6 -> sb.append('.')
                9 -> sb.append('-')
            }
            sb.append(digitos[i])
        }
        return sb.toString()
    }

    /** Aplica máscara de telefone: (00) 00000-0000. */
    fun formatarTelefone(valor: String?): String {
        val digitos = somenteDigitos(valor).take(11)
        return when {
            digitos.isEmpty() -> ""
            digitos.length <= 2 -> "($digitos"
            digitos.length <= 7 -> "(${digitos.substring(0, 2)}) ${digitos.substring(2)}"
            else -> {
                val meio = if (digitos.length == 11) 7 else 6
                "(${digitos.substring(0, 2)}) ${digitos.substring(2, meio)}-${digitos.substring(meio)}"
            }
        }
    }

    /**
     * Converte uma data ISO da API (`AAAA-MM-DD` ou `AAAA-MM-DDTHH:mm:ss`)
     * para o formato brasileiro `dd/MM/yyyy`. Retorna `N/A` quando inválida.
     */
    fun formatarData(iso: String?): String {
        val data = parseData(iso) ?: return "N/A"
        return data.format(formatoBR)
    }

    /** Converte data/hora ISO para `dd/MM/yyyy HH:mm`. */
    fun formatarDataHora(iso: String?): String {
        val momento = parseDataHora(iso) ?: return "N/A"
        return momento.format(formatoBRHora)
    }

    /** Interpreta uma data ISO (só data ou data/hora) como [LocalDate]. */
    fun parseData(iso: String?): LocalDate? {
        if (iso.isNullOrBlank()) return null
        return try {
            when {
                iso.contains('T') -> parseDataHora(iso)?.toLocalDate()
                else -> LocalDate.parse(iso.substring(0, 10))
            }
        } catch (e: Exception) {
            null
        }
    }

    /** Interpreta data/hora ISO como [LocalDateTime]. */
    fun parseDataHora(iso: String?): LocalDateTime? {
        if (iso.isNullOrBlank()) return null
        return try {
            when {
                iso.endsWith("Z") -> LocalDateTime.ofInstant(Instant.parse(iso), zone)
                iso.contains('T') -> LocalDateTime.parse(iso.substringBefore('.'))
                else -> LocalDate.parse(iso.substring(0, 10)).atStartOfDay()
            }
        } catch (e: Exception) {
            null
        }
    }

    /** Data local de hoje no padrão ISO (`AAAA-MM-DD`), usado em formulários. */
    fun hojeIso(): String = LocalDate.now().toString()

    /** Número no padrão brasileiro (2.450,50). */
    fun formatarNumero(valor: Double): String =
        String.format(Locale("pt", "BR"), "%,.2f", valor)
}
