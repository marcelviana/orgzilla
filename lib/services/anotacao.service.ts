import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Usuario } from '@/lib/types'
import { AnotacaoRepository } from '@/lib/repositories/anotacao.repository'
import type { AnotacaoComUsuario } from '@/lib/repositories/anotacao.repository'
import { PermissaoService } from './permissao.service'
import { PessoaRepository } from '@/lib/repositories'

export class AnotacaoService {
  private anotacaoRepo: AnotacaoRepository
  private permissaoService: PermissaoService
  private pessoaRepo: PessoaRepository

  constructor(supabase: SupabaseClient<Database>) {
    this.anotacaoRepo = new AnotacaoRepository(supabase)
    this.permissaoService = new PermissaoService(supabase)
    this.pessoaRepo = new PessoaRepository(supabase)
  }

  async listarPorPessoa(usuario: Usuario, pessoaId: string): Promise<AnotacaoComUsuario[]> {
    await this.verificarAcessoPessoa(usuario, pessoaId)
    return this.anotacaoRepo.findByEntidadeWithUsuario('pessoa', pessoaId)
  }

  async criarParaPessoa(usuario: Usuario, pessoaId: string, conteudo: string): Promise<AnotacaoComUsuario> {
    await this.verificarAcessoPessoa(usuario, pessoaId)

    const anotacao = await this.anotacaoRepo.create({
      tipo_entidade: 'pessoa',
      entidade_id: pessoaId,
      conteudo: conteudo.trim(),
      criado_por_usuario_id: usuario.id,
    })

    return (await this.anotacaoRepo.findByIdWithUsuario(anotacao.id)) ?? { ...anotacao }
  }

  private async verificarAcessoPessoa(usuario: Usuario, pessoaId: string): Promise<void> {
    if (usuario.tipo_perfil === 'gestor') {
      const timeIds = await this.permissaoService.getTimesHierarquia(usuario)
      const pessoa = await this.pessoaRepo.findById(pessoaId)
      if (!pessoa || !pessoa.time_id || !timeIds.includes(pessoa.time_id)) {
        throw new Error('Sem permissão para acessar anotações desta pessoa')
      }
    }
    // admin e visualizador: sem restrição de hierarquia (RLS protege dados sensíveis)
  }
}
