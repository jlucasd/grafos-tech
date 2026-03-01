# Grafos Tech Odometer Verification

A fleet management interface for validating vehicle odometer readings and fiscal notes using AI image analysis.

## Endpoint: Validação de Canhotos de Notas Fiscais

**URL:** `POST /api/validate-fiscal-note`

Este endpoint recebe uma requisição do tipo `multipart/form-data` contendo a imagem do canhoto e o número da nota fiscal esperado. Ele utiliza a API do Gemini para processar a imagem com as mesmas regras da interface visual.

### Parâmetros (Form Data)
- `image` (File): O arquivo de imagem do canhoto (PNG, JPG, PDF, etc).
- `nfNumber` (Text): O número da nota fiscal que você espera encontrar na imagem.

### Exemplo de Resposta de Sucesso (JSON)
```json
{
  "status": "validated",
  "aiData": {
    "classification": "CANHOTO",
    "nfNumberFound": "450912001",
    "isNfMatch": true,
    "isSigned": true,
    "confidence": 0.98
  }
}
```
*O `status` pode ser: `validated` (sucesso total), `review` (necessita revisão manual) ou `rejected` (rejeitado).*

---

## Como Testar o Endpoint

Você pode testar esse endpoint utilizando ferramentas como **Postman**, **Insomnia** ou via **cURL** no seu terminal.

### Opção 1: Usando cURL no terminal
Substitua `caminho/para/sua/imagem.jpg` pelo caminho real de uma imagem no seu computador e `123456` pelo número da nota fiscal:

```bash
curl -X POST https://ais-dev-q4hf6i2k4wk5lnlmuqfvwh-222058879677.us-east1.run.app/api/validate-fiscal-note \
  -F "image=@caminho/para/sua/imagem.jpg" \
  -F "nfNumber=123456"
```

### Opção 2: Usando Postman / Insomnia
1. Crie uma nova requisição do tipo **POST**.
2. Insira a URL: `https://ais-dev-q4hf6i2k4wk5lnlmuqfvwh-222058879677.us-east1.run.app/api/validate-fiscal-note`
3. Vá na aba **Body** e selecione a opção **form-data**.
4. Adicione os seguintes campos:
   - **Key:** `image` | **Type:** File | **Value:** (Selecione um arquivo de imagem do seu computador)
   - **Key:** `nfNumber` | **Type:** Text | **Value:** `123456` (ou o número da NF que deseja validar)
5. Clique em **Send** e veja a resposta em JSON com a análise da IA.
