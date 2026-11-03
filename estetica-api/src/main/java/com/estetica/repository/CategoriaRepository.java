package com.estetica.repository;

import com.estetica.model.Categoria;
import com.estetica.model.SetorAtuacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoriaRepository extends JpaRepository<Categoria, Long> {
    List<Categoria> findByAtivoTrueOrderByOrdemExibicaoAsc();
    List<Categoria> findBySetorAndAtivoTrueOrderByOrdemExibicaoAsc(SetorAtuacao setor);
    List<Categoria> findBySetor(SetorAtuacao setor);
}

