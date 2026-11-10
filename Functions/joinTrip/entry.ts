import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Please sign in first.' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const token = typeof body.token === 'string' ? body.token.trim() : '';
    if (!token || token.length < 6) {
      return Response.json({ error: 'This invite link is missing its code.' }, { status: 400 });
    }

    const invites = await base44.asServiceRole.entities.TripInvite.filter({ token });
    const invite = Array.isArray(invites) ? invites[0] : invites?.items?.[0];
    if (!invite) return Response.json({ error: 'This invite link is not valid.' }, { status: 404 });
    if (invite.revoked) return Response.json({ error: 'This invite link was revoked.' }, { status: 410 });
    if (invite.expires_at && new Date(invite.expires_at).getTime() < Date.now()) {
      return Response.json({ error: 'This invite link has expired. Ask for a new one.' }, { status: 410 });
    }

    const trip = await base44.asServiceRole.entities.Trip.get(invite.trip_id).catch((e) =>
      e.status === 404 ? null : Promise.reject(e)
    );
    if (!trip) return Response.json({ error: 'That trip no longer exists.' }, { status: 404 });

    const name = user.data?.display_name || user.full_name || (user.email || '').split('@')[0];
    const members = Array.isArray(trip.members) ? trip.members : [];
    const alreadyMember = members.includes(user.id);

    if (alreadyMember) {
      const existing = await base44.asServiceRole.entities.TripMember.filter({
        trip_id: trip.id,
        user_id: user.id,
      });
      if (!existing || existing.length === 0) {
        await base44.asServiceRole.entities.TripMember.create({
          trip_id: trip.id,
          user_id: user.id,
          user_name: name,
          user_email: user.email || '',
          role: 'member',
          members,
        });
      }
      return Response.json({ trip_id: trip.id, already_member: true });
    }

    await base44.asServiceRole.entities.Trip.update(trip.id, { members: [...members, user.id] });

    await base44.asServiceRole.entities.TripMember.create({
      trip_id: trip.id,
      user_id: user.id,
      user_name: name,
      user_email: user.email || '',
      role: 'member',
      members: [...members, user.id],
    });

    const scoped = ['Expense', 'Settlement', 'ActivityEvent', 'ChatMessage', 'ItineraryItem', 'TripInvite', 'TripMember'];
    for (const entityName of scoped) {
      await base44.asServiceRole.entities[entityName].updateMany(
        { trip_id: trip.id },
        { $addToSet: { members: user.id } }
      );
    }

    await base44.asServiceRole.entities.ActivityEvent.create({
      trip_id: trip.id,
      type: 'member_joined',
      actor_id: user.id,
      actor_name: name,
      message: `${name} joined the trip`,
      members: [...members, user.id],
    });

    return Response.json({ trip_id: trip.id, already_member: false });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}