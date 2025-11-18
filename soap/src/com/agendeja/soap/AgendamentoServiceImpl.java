package com.agendeja.soap;

import javax.jws.WebService;
import java.sql.*;
import java.time.LocalTime;

// Implementação do serviço de agendamento
@WebService(endpointInterface = "com.agendeja.soap.AgendamentoService")
public class AgendamentoServiceImpl implements AgendamentoService {

    @Override
    public String consultarDisponibilidade(String data) {
        StringBuilder disponiveis = new StringBuilder(); // Horários disponíveis, string builder por que é mais eficiente para concatenações

        String[] horarios = {"13:00", "14:00", "15:00", "16:00", "17:00"}; // Horários fixos disponíveis

        try (Connection conn = Database.connect()) { // Conexão com o banco de dados
            for (String h : horarios) { // pra cada horário fixo
                PreparedStatement ps = conn.prepareStatement(
                        "SELECT * FROM agendamento WHERE data=? AND hora_inicio=? AND status='Confirmado'"
                ); // Verifica se já existe um agendamento confirmado para aquele dia e hora
                ps.setString(1, data); // Define o parâmetro data, setando a data fornecida na consulta
                ps.setString(2, h); // Define o parâmetro hora_inicio, setando o horário fixo atual

                ResultSet rs = ps.executeQuery(); // Executa a consulta

                if (!rs.next()) disponiveis.append(h).append(","); // Se não houver agendamento, adiciona o horário à lista de disponíveis
            }
        } catch (Exception e) {
            return "Erro: " + e.getMessage();
        }

        return disponiveis.toString();
    }

    @Override
    public String agendarServico(int clienteId, int servicoId, String data, String horaInicio) { //agenda serviço passando clienteId, servicoId, data e horaInicio
        try (Connection conn = Database.connect()) { //tenta conexão como banco 

            // Buscar duração
            PreparedStatement s1 = conn.prepareStatement("SELECT duracao_min FROM servicos WHERE id=?");
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
}
