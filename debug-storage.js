// Script para debugar o Supabase Storage usando service role
import { createClient } from '@supabase/supabase-js';

// Configurações do Supabase com service role (mais permissões)
const supabaseUrl = 'https://kdpdpcwjdkcbuvjksokd.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtkcGRwY3dqZGtjYnV2amtzb2tkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzEyMTQxMiwiZXhwIjoyMDY4Njk3NDEyfQ.x1CMr1BqkRRqgjY8swBHnG6nBK8J_qXM0YbR5qCZEJ0';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugStorage() {
  console.log('🔧 Debug do Supabase Storage com Service Role...');
  
  try {
    // 1. Listar todos os buckets
    console.log('\n1. Listando todos os buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Erro ao listar buckets:', bucketsError);
      return;
    }
    
    console.log('📋 Buckets encontrados:', buckets?.length || 0);
    buckets?.forEach(bucket => {
      console.log(`  - ${bucket.name} (id: ${bucket.id}, public: ${bucket.public})`);
    });
    
    // 2. Verificar se chat-files existe
    const chatFilesBucket = buckets?.find(b => b.id === 'chat-files' || b.name === 'chat-files');
    if (chatFilesBucket) {
      console.log('\n✅ Bucket chat-files encontrado:', chatFilesBucket);
      
      // 3. Listar arquivos no bucket
      console.log('\n2. Listando arquivos no bucket chat-files...');
      const { data: files, error: filesError } = await supabase.storage
        .from('chat-files')
        .list('', { limit: 10 });
      
      if (filesError) {
        console.error('❌ Erro ao listar arquivos:', filesError);
      } else {
        console.log(`📁 Arquivos encontrados: ${files?.length || 0}`);
        files?.forEach(file => {
          console.log(`  - ${file.name} (${file.metadata?.size || 'tamanho desconhecido'} bytes)`);
        });
        
        // 4. Testar URL pública de um arquivo
        if (files && files.length > 0) {
          const testFile = files[0];
          console.log(`\n3. Testando URL pública do arquivo: ${testFile.name}`);
          
          const { data: urlData } = supabase.storage
            .from('chat-files')
            .getPublicUrl(testFile.name);
          
          console.log(`🔗 URL gerada: ${urlData.publicUrl}`);
          
          // Testar acesso
          try {
            const response = await fetch(urlData.publicUrl, { method: 'HEAD' });
            console.log(`📊 Status: ${response.status} ${response.statusText}`);
            
            if (!response.ok) {
              const errorResponse = await fetch(urlData.publicUrl);
              const errorText = await errorResponse.text();
              console.log('🔍 Erro:', errorText);
            }
          } catch (fetchError) {
            console.error('❌ Erro ao testar URL:', fetchError.message);
          }
        }
      }
    } else {
      console.log('\n❌ Bucket chat-files NÃO encontrado!');
      
      // 5. Tentar criar o bucket manualmente
      console.log('\n4. Tentando criar bucket chat-files...');
      const { data: createData, error: createError } = await supabase.storage
        .createBucket('chat-files', {
          public: true,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'text/plain', 'text/csv',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          ]
        });
      
      if (createError) {
        console.error('❌ Erro ao criar bucket:', createError);
      } else {
        console.log('✅ Bucket criado com sucesso:', createData);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

// Executar debug
debugStorage().then(() => {
  console.log('\n🏁 Debug concluído');
}).catch(error => {
  console.error('💥 Erro fatal:', error);
});