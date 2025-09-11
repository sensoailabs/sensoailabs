// Script para testar URLs do Supabase Storage
import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase (usando as mesmas do projeto)
const supabaseUrl = 'https://kdpdpcwjdkcbuvjksokd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkcGRwY3dqZGtjYnV2amtzb2tkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMjE0MTIsImV4cCI6MjA2ODY5NzQxMn0.u5CISAlH6shReiO8P1NZjJf4zgCkltO2i5B-9UUDbW4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testStorageUrls() {
  console.log('🔍 Testando URLs do Supabase Storage...');
  
  try {
    // 1. Verificar se o bucket existe
    console.log('\n1. Verificando bucket "chat-files"...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Erro ao listar buckets:', bucketsError);
      return;
    }
    
    console.log('📋 Buckets disponíveis:', buckets?.map(b => ({ name: b.name, public: b.public })));
    
    const chatFilesBucket = buckets?.find(b => b.name === 'chat-files');
    if (!chatFilesBucket) {
      console.log('⚠️  Bucket "chat-files" não encontrado, mas continuando teste...');
      // Tentar usar o primeiro bucket disponível ou criar teste com bucket inexistente
      if (buckets && buckets.length > 0) {
        console.log(`🔄 Testando com bucket: ${buckets[0].name}`);
      }
    } else {
      console.log('✅ Bucket "chat-files" encontrado:', chatFilesBucket);
    }
    
    console.log('✅ Bucket "chat-files" encontrado:', chatFilesBucket);
    
    // 2. Listar arquivos no bucket
    console.log('\n2. Listando arquivos no bucket...');
    const { data: files, error: filesError } = await supabase.storage
      .from('chat-files')
      .list('', { limit: 10 });
    
    if (filesError) {
      console.error('❌ Erro ao listar arquivos:', filesError);
      return;
    }
    
    console.log(`📁 Encontrados ${files?.length || 0} arquivos no bucket`);
    
    if (files && files.length > 0) {
      // 3. Testar URLs públicas dos arquivos existentes
      console.log('\n3. Testando URLs públicas dos arquivos...');
      
      for (const file of files.slice(0, 3)) { // Testar apenas os primeiros 3
        const { data: urlData } = supabase.storage
          .from('chat-files')
          .getPublicUrl(file.name);
        
        console.log(`\n📄 Arquivo: ${file.name}`);
        console.log(`🔗 URL: ${urlData.publicUrl}`);
        
        // Testar se a URL é acessível
        try {
          const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
          console.log(`📊 Status: ${response.status} ${response.statusText}`);
          console.log(`📋 Content-Type: ${response.headers.get('content-type')}`);
          console.log(`📏 Content-Length: ${response.headers.get('content-length')}`);
          
          if (response.ok) {
            console.log('✅ URL acessível');
          } else {
            console.log('❌ URL não acessível');
            // Tentar obter o corpo da resposta de erro
            try {
              const errorResponse = await fetch(urlData.publicUrl);
              const errorText = await errorResponse.text();
              console.log('🔍 Detalhes do erro:', errorText);
            } catch (e) {
              console.log('⚠️  Não foi possível obter detalhes do erro');
            }
          }
        } catch (fetchError) {
          console.error('❌ Erro ao acessar URL:', fetchError.message);
        }
      }
    } else {
      console.log('📭 Nenhum arquivo encontrado no bucket');
    }
    
    // 4. Testar geração de URL para arquivo inexistente
    console.log('\n4. Testando URL para arquivo inexistente...');
    const { data: fakeUrlData } = supabase.storage
      .from('chat-files')
      .getPublicUrl('arquivo-inexistente.pdf');
    
    console.log(`🔗 URL gerada: ${fakeUrlData.publicUrl}`);
    
    try {
      const response = await fetch(fakeUrlData.publicUrl, { method: 'HEAD' });
      console.log(`📊 Status: ${response.status} ${response.statusText}`);
    } catch (fetchError) {
      console.error('❌ Erro esperado para arquivo inexistente:', fetchError.message);
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar teste
testStorageUrls().then(() => {
  console.log('\n🏁 Teste concluído');
}).catch(error => {
  console.error('💥 Erro fatal:', error);
});