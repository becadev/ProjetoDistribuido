package com.agendeja.soap;

import javax.jws.WebService;
import java.sql.*;
import java.time.LocalTime;

// Implementação do serviço de agendamento
@WebService(endpointInterface = "com.agendeja.soap.AgendamentoService")
public class AgendamentoServiceImpl implements AgendamentoService {

    @Override
    public String consultarDisponibilidade(String data) {
        StringBuilder disponiveis = new StringBuilder();

        String[] horarios = {"13:00", "14:00", "15:00", "16:00", "17:00"};

        try (Connection conn = Database.connect()) {
            for (String h : horarios) {
                LocalTime horarioConsulta = LocalTime.parse(h);
                boolean ocupado = false;

                // Buscar TODOS os agendamentos confirmados do dia
                PreparedStatement ps = conn.prepareStatement(
                        "SELECT hora_inicio, hora_fim FROM agendamento WHERE data=? AND status='Confirmado'"
                );
                ps.setString(1, data);
                ResultSet rs = ps.executeQuery();

                // Verificar se o horário está dentro de algum agendamento existente
                while (rs.next()) {
                    LocalTime inicioOcupado = LocalTime.parse(rs.getString("hora_inicio"));
                    LocalTime fimOcupado = LocalTime.parse(rs.getString("hora_fim"));

                    // Se o horário consultado está entre inicio e fim de um agendamento, está ocupado
                    if (!horarioConsulta.isBefore(inicioOcupado) && horarioConsulta.isBefore(fimOcupado)) {
                        ocupado = true;
                        break;
                    }
                }

                if (!ocupado) disponiveis.append(h).append(",");
            }
        } catch (Exception e) {
            return "Erro: " + e.getMessage();
        }

        return disponiveis.toString();
    }

    @Override
    public String agendarServico(int clienteId, int servicoId, String data, String horaInicio) { //agenda serviço passando clienteId, servicoId, data e horaInicio
        try (Connection conn = Database.connect()) { //tenta conexão como banco 

            // Buscar duração (tabela Django: servicos_servico)
            PreparedStatement s1 = conn.prepareStatement("SELECT duracao_min FROM servicos_servico WHERE id=?");
            s1.setInt(1, servicoId); // Define o parâmetro id, setando o servicoId fornecido
            ResultSet rs1 = s1.executeQuery();

            if (!rs1.next()) return "Serviço não encontrado"; //se não achar o serviço, retorna mensagem

            int duracao = rs1.getInt("duracao_min"); //pega a duração do serviço

            LocalTime inicio = LocalTime.parse(horaInicio); // Converte a hora de início para LocalTime
            LocalTime fim = inicio.plusMinutes(duracao); // Calcula a hora de fim somando a duração

            // Verificar conflitos
            PreparedStatement s2 = conn.prepareStatement("SELECT * FROM agendamento WHERE data=?"); //pega todos os agendamentos do dia
            s2.setString(1, data); //define a data
            ResultSet rs2 = s2.executeQuery();

            while (rs2.next()) { //para cada agendamento naquele dia
                LocalTime ocupadoInicio = LocalTime.parse(rs2.getString("hora_inicio")); //pega hora inicio do agendamento
                LocalTime ocupadoFim = LocalTime.parse(rs2.getString("hora_fim")); //pega hora fim do agendamento

                if (inicio.isBefore(ocupadoFim) && fim.isAfter(ocupadoInicio)) { //verifica se há conflito de horários
                    return "Horário indisponível";
                }
            }

            // Inserir
            PreparedStatement insert = conn.prepareStatement( //se não houver conflito, insere o agendamento
                    "INSERT INTO agendamento(cliente_id, servico_id, data, hora_inicio, hora_fim, status)" +
                            " VALUES (?, ?, ?, ?, ?, 'Confirmado')"
            );

            insert.setInt(1, clienteId);
            insert.setInt(2, servicoId);
            insert.setString(3, data);
            insert.setString(4, horaInicio);
            insert.setString(5, fim.toString());
            insert.executeUpdate();

            return "Agendado das " + horaInicio + " às " + fim;

        } catch (Exception e) {
            return "Erro: " + e.getMessage();
        }
    }

    @Override
    public String cancelarAgendamento(int id) {
        try (Connection conn = Database.connect()) {
            PreparedStatement ps = conn.prepareStatement( //prepara a atualização do status do agendamento para 'Cancelado'
                    "UPDATE agendamento SET status='Cancelado' WHERE id=?"
            );
            ps.setInt(1, id);
            ps.executeUpdate();
            return "Agendamento cancelado";

        } catch (Exception e) {
            return "Erro: " + e.getMessage();
        }
    }

    @Override
    public String listarAgendamentos() {
        StringBuilder json = new StringBuilder("[");

        try (Connection conn = Database.connect()) {
            PreparedStatement ps = conn.prepareStatement(
                "SELECT a.id, a.cliente_id, a.servico_id, a.data, a.hora_inicio, a.hora_fim, a.status, " +
                "c.nome as cliente_nome, s.nome as servico_nome " +
                "FROM agendamento a " +
                "LEFT JOIN servicos_cliente c ON a.cliente_id = c.id " +
                "LEFT JOIN servicos_servico s ON a.servico_id = s.id " +
                "WHERE a.status = 'Confirmado' " +
                "ORDER BY a.data, a.hora_inicio"
            );
            ResultSet rs = ps.executeQuery();

            boolean primeiro = true;
            while (rs.next()) {
                if (!primeiro) json.append(",");
                primeiro = false;

                json.append("{")
                    .append("\"id\":").append(rs.getInt("id")).append(",")
                    .append("\"cliente_id\":").append(rs.getInt("cliente_id")).append(",")
                    .append("\"cliente_nome\":\"").append(rs.getString("cliente_nome") != null ? rs.getString("cliente_nome") : "").append("\",")
                    .append("\"servico_id\":").append(rs.getInt("servico_id")).append(",")
                    .append("\"servico_nome\":\"").append(rs.getString("servico_nome") != null ? rs.getString("servico_nome") : "").append("\",")
                    .append("\"data\":\"").append(rs.getString("data")).append("\",")
                    .append("\"hora_inicio\":\"").append(rs.getString("hora_inicio")).append("\",")
                    .append("\"hora_fim\":\"").append(rs.getString("hora_fim")).append("\",")
                    .append("\"status\":\"").append(rs.getString("status")).append("\"")
                    .append("}");
            }

        } catch (Exception e) {
            return "{\"erro\":\"" + e.getMessage() + "\"}";
        }

        json.append("]");
        return json.toString();
    }
}
