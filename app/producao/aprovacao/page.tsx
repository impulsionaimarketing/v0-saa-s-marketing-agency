// 4. Upload via Vercel Blob
      if (data.file) {
        try {
          const response = await fetch(
            `/api/upload-video?filename=${encodeURIComponent(data.file.name)}&productionId=${created.id}`,
            {
              method: 'POST',
              body: data.file,
              headers: {
                'content-type': data.file.type,
                'content-length': String(data.file.size),
              },
            }
          )
          if (!response.ok) {
            toast.error('Produção criada, mas houve falha no upload.')
          }
        } catch (uploadError) {
          console.error('[v0] Erro no upload:', uploadError)
          toast.error('Produção criada, mas houve falha no upload.')
        }
      }
