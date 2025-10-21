 // test-vertex.ts
  import { VertexAI } from '@google-cloud/vertexai';

  const vertexAI = new VertexAI({
    project: 'signals-scout', // Your project with billing enabled!
    location: 'us-central1',
  });

  const model = vertexAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

  async function test() {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: 'Hello Vertex AI!' }] }],
    });

    console.log('✅ Vertex AI is working!');
    console.log(result.response.candidates?.[0]?.content?.parts?.[0]?.text);
  }

  test();