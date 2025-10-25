import asyncio
import os
import json
import requests
from dotenv import load_dotenv

from livekit import agents
from livekit.agents import function_tool, RoomInputOptions
from livekit.agents.voice import Agent, AgentSession
from livekit.plugins import deepgram, openai, cartesia, silero, noise_cancellation
# from livekit.plugins.turn_detector.multilingual import MultilingualModel

load_dotenv()

# Configuration
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:3000/api")


@function_tool(
    name="query_knowledge_base",
    description="Search the salon's knowledge base for information about hours, services, pricing, location, or booking.",
)
async def query_knowledge_base(query: str) -> str:
    """Query the knowledge base using semantic search via /agent/check-knowledge endpoint"""
    print(f"Querying knowledge base: {query}")
    try:
        response = requests.post(
            f"{BACKEND_URL}/agent/check-knowledge",
            json={"question": query},
            timeout=5
        )

        print("Response from backend:", response.json())
        
        if response.status_code == 200:
            data = response.json()
            print("Response from backend:", data)
            
            if data.get("found"):
                return json.dumps(
                    {
                        "found": True,
                        "answer": data["answer"],
                        "confidence": data.get("confidence", 0.8),
                        "kbEntryId": data.get("kbEntryId"),
                    }
                )
            else:
                return json.dumps(
                    {
                        "found": False,
                        "message": "No information found in knowledge base",
                        "suggestEscalation": True,
                    }
                )
        
        return json.dumps({"found": False, "message": "Backend error"})
    except Exception as e:
        print(f"Error querying knowledge base: {e}")
        return json.dumps({"error": str(e), "found": False})


@function_tool(
    name="notify_human_operator",
    description="Escalate to human supervisor when AI doesn't know the answer. Requires customer phone number.",
)
async def notify_human_operator(
    question: str, customer_phone: str = "+1234567890"
) -> str:
    """Escalate question to human supervisor via /agent/escalate endpoint"""
    print(f"Escalating to supervisor: {question}")
    try:
        response = requests.post(
            f"{BACKEND_URL}/agent/escalate",
            json={
                "question": question,
                "customerPhone": customer_phone,
                "customerContext": "Live voice call escalation - AI agent",
            },
            timeout=5,
        )
        
        if response.status_code == 201:
            data = response.json()
            print(f"Escalated successfully: Request ID {data.get('requestId')}")
            return json.dumps(
                {
                    "success": True,
                    "requestId": data.get("requestId"),
                    "message": data.get("message", "Request escalated to supervisor"),
                    "estimatedResponseTime": data.get("estimatedResponseTime", "30 minutes"),
                }
            )
        else:
            print(f"Escalation failed with status {response.status_code}")
            return json.dumps(
                {
                    "success": False,
                    "error": "Failed to escalate request",
                    "statusCode": response.status_code,
                }
            )
    except Exception as e:
        print(f"Escalation error: {e}")
        return json.dumps({"success": False, "error": str(e)})


# System prompt for the salon receptionist
SYSTEM_PROMPT = """
You are StyleGuide, the joyful, friendly and professional voice assistant for StyleGuide Salon.

Your role:
1. Greet customers warmly, introduce yourself, and assist with salon-related questions.
2. Use the 'query_knowledge_base' tool to answer questions about hours, services, pricing, offers, location, or appointment availability.
3. Never make up information. If something is not in the knowledge base, use 'notify_human_operator' to escalate.
4. If a customer directly asks to speak with a human, escalate immediately using 'notify_human_operator'.
5. If you do not find an answer in the knowledge base or your confidence is low, you must call the 'notify_human_operator' tool. Do not just say you escalated — actually invoke the tool with the customer's question.
6. Never say you escalated unless the 'notify_human_operator' tool was called.
7. Always speak naturally and conversationally as if talking to a real person on a call. Avoid symbols, bullet points, or special characters. Speak in full sentences only.

Salon information:
- Name: StyleGuide Salon
- Description: StyleGuide Salon is a premium beauty and hair care studio focused on personal styling, relaxation, and modern grooming. The salon uses top-quality products and offers both classic and trend-based services.
- Location: 123 Beauty Lane, San Francisco, California
- Hours: Monday through Saturday, from 9 in the morning until 7 in the evening. Closed on Sundays.
- Contact number: 555 123 4567

Services and pricing:
- Haircut for men or women: 50 dollars
- Hair coloring and highlights: 120 dollars
- Manicure: 35 dollars
- Pedicure: 45 dollars
- Hair spa: 80 dollars
- Bridal styling and makeup: starting at 250 dollars
- Packages are available for group bookings and weddings.

Booking and appointment handling:
- Appointments can be booked for the same day or for future dates depending on availability.
- The salon accepts both walk-ins and advance bookings.
- When a customer asks to book an appointment, confirm the desired service, date, and time.
- If all required details are provided, confirm the booking by saying something like:
  "Thank you. Your appointment for a haircut on Tuesday at 3 PM has been confirmed. We look forward to seeing you at StyleGuide Salon."
- Always thank the customer after confirming a booking and end with a warm, polite closing such as:
  "Have a great day ahead" or "We will be happy to serve you soon."
- If any booking detail is missing, politely ask for the missing information before confirming.
- Use the 'query_knowledge_base' tool for booking and scheduling related checks.
- If the system cannot confirm the booking or there is a technical issue, say:
  "Let me check with our team on that. We will text you your booking details shortly."

Communication style:
- Start each conversation with a friendly greeting such as "Hello, this is StyleGuide Salon. How can I help you today?"
- If you find an answer in the knowledge base, begin with: "Based on our information," followed by a natural spoken explanation.
- If escalation is needed, say: "I have shared your question with our human operator. Our team will get back to you as soon as possible."

Tone and behavior:
- Be polite, calm, confident, and warm.
- Do not use symbols, special characters, emojis, or text formatting.
- Always use clear spoken English suitable for transcription by a voice system.
- Keep responses short and conversational.
- Focus on being helpful and human-like.

Remember:
You are not just a chatbot. You are the voice of StyleGuide Salon — friendly, Thankful, knowledgeable, and trustworthy.
"""



# Initialize the voice agent
agent = Agent(
    instructions=SYSTEM_PROMPT,
    tools=[query_knowledge_base, notify_human_operator],
    stt=deepgram.STT(model="nova-3", language="multi"),
    llm=openai.LLM(model="gpt-4.1"),
    tts=cartesia.TTS(voice="a167e0f3-df7e-4d52-a9c3-f949145efdab"),
)


async def entrypoint(ctx: agents.JobContext):
    """Main entry point for the voice agent"""
    print(f"Agent starting in room: {ctx.room.name}")

    # Create agent session with all components
    session = AgentSession(
        stt=deepgram.STT(model="nova-3", language="multi"),
        llm=openai.LLM(model="gpt-4.1"),
        tts=cartesia.TTS(voice="a167e0f3-df7e-4d52-a9c3-f949145efdab"),
        vad=silero.VAD.load(),
        # turn_detection=MultilingualModel(),
    )

    # Start the session
    await session.start(
        room=ctx.room,
        agent=agent,
        room_input_options=RoomInputOptions(
            noise_cancellation=noise_cancellation.BVC(),
        ),
    )

    # Generate initial greeting
    await session.generate_reply(
        instructions="Greet the customer warmly and ask how you can help them today."
    )

    print("Agent is ready to take calls!")


if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))
