package com.estetica.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(RecursoNaoEncontradoException.class)
    public ProblemDetail handleNotFound(RecursoNaoEncontradoException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setTitle("Recurso Não Encontrado");
        problem.setType(URI.create("https://clinicaestetica.com/erros/recurso-nao-encontrado"));
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }

    @ExceptionHandler(HorarioIndisponivelException.class)
    public ProblemDetail handleHorarioIndisponivel(HorarioIndisponivelException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        problem.setTitle("Conflito de Horário / Double-Booking");
        problem.setType(URI.create("https://clinicaestetica.com/erros/horario-indisponivel"));
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }

    @ExceptionHandler(RegraNegocioException.class)
    public ProblemDetail handleRegraNegocio(RegraNegocioException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        problem.setTitle("Regra de Negócio Violada");
        problem.setType(URI.create("https://clinicaestetica.com/erros/regra-de-negocio"));
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }

    @ExceptionHandler(PagamentoPendenteException.class)
    public ProblemDetail handlePagamentoPendente(PagamentoPendenteException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.PAYMENT_REQUIRED, ex.getMessage());
        problem.setTitle("Pagamento PIX Pendente");
        problem.setType(URI.create("https://clinicaestetica.com/erros/pagamento-pendente"));
        problem.setProperty("paymentId", ex.getPaymentId());
        problem.setProperty("pixCopiaCola", ex.getPixCopiaCola());
        problem.setProperty("pixQrCodeBase64", ex.getPixQrCodeBase64());
        problem.setProperty("valor", ex.getValor());
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ProblemDetail handleBadCredentials(BadCredentialsException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, "Credenciais inválidas: e-mail ou senha incorretos.");
        problem.setTitle("Autenticação Falhou");
        problem.setType(URI.create("https://clinicaestetica.com/erros/unauthorized"));
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ProblemDetail handleAccessDenied(AccessDeniedException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, "Você não tem permissão para acessar este recurso.");
        problem.setTitle("Acesso Negado");
        problem.setType(URI.create("https://clinicaestetica.com/erros/forbidden"));
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.UNPROCESSABLE_ENTITY, "Erros de validação nos campos informados.");
        problem.setTitle("Dados Inválidos");
        problem.setType(URI.create("https://clinicaestetica.com/erros/validacao"));
        problem.setProperty("timestamp", Instant.now());

        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(error.getField(), error.getDefaultMessage());
        }
        problem.setProperty("erros", fieldErrors);
        return problem;
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleGeneral(Exception ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, "Ocorreu um erro interno inesperado no servidor.");
        problem.setTitle("Erro Interno do Servidor");
        problem.setType(URI.create("https://clinicaestetica.com/erros/erro-interno"));
        problem.setProperty("detalheTecnico", ex.getMessage());
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }
}

