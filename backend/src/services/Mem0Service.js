const { MemoryClient } = require("mem0ai");

class Mem0Service {
  constructor() {
    this.client = new MemoryClient({
      apiKey: process.env.MEM0_API_KEY,
    });
    this.agentId = "salon-receptionist";
  }

  /**
   * Add memory to Mem0
   */
  async addMemory(question, answer, metadata = {}) {
    try {
      const content = `Question: ${question}\nAnswer: ${answer}`;

      const result = await this.client.add(
        [{ role: "user", content: content }],
        {
          user_id: this.agentId,
          metadata: {
            type: "knowledge",
            question,
            category: metadata.category || "general",
            source: metadata.source || "learned",
            tags: metadata.tags || [],
            createdAt: new Date().toISOString(),
          },
        }
      );

      console.log(`Added memory to Mem0: ${result.results?.[0]?.id || 'success'}`);
      return result.results?.[0]?.id || `mem_${Date.now()}`;
    } catch (error) {
      console.error("Mem0 add error:", error);
      throw error;
    }
  }

  /**
   * Semantic search in Mem0
   */
  async searchMemory(query, limit = 5) {
    try {
      const results = await this.client.search(query, {
        user_id: this.agentId,
        limit,
      });

      const memories = Array.isArray(results) ? results : (results.results || []);
      
      return memories.map((r) => ({
        id: r.id,
        content: r.memory || r.content,
        score: r.score || 0.8,
        metadata: r.metadata || {},
      }));
    } catch (error) {
      console.error("Mem0 search error:", error);
      return [];
    }
  }

  /**
   * Get all memories
   */
  async getAllMemories() {
    try {
      const memories = await this.client.getAll({
        user_id: this.agentId,
      });
      return memories;
    } catch (error) {
      console.error("Mem0 getAll error:", error);
      return [];
    }
  }

  /**
   * Update existing memory
   */
  async updateMemory(memoryId, newContent, metadata = {}) {
    try {
      await this.client.update(memoryId, {
        data: newContent,
        metadata,
      });

      console.log(`Updated memory in Mem0: ${memoryId}`);
      return true;
    } catch (error) {
      console.error("Mem0 update error:", error);
      return false;
    }
  }

  /**
   * Delete memory from Mem0
   */
  async deleteMemory(memoryId) {
    try {
      await this.client.delete(memoryId);
      console.log(`Deleted memory from Mem0: ${memoryId}`);
      return true;
    } catch (error) {
      console.error("Mem0 delete error:", error);
      return false;
    }
  }
}

module.exports = new Mem0Service();
