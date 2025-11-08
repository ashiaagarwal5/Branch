'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Users, Search, Check, X } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import toast from 'react-hot-toast';
import type { User } from '@dan/shared';

const functions = getFunctions();

interface FriendRequestUser {
  id: string;
  displayName: string;
  username: string;
  photoURL?: string;
  xp: number;
  level: number;
}

export function FriendManager() {
  const { user } = useAuthContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [incomingRequests, setIncomingRequests] = useState<FriendRequestUser[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<FriendRequestUser[]>([]);
  const [friends, setFriends] = useState<FriendRequestUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadFriendsAndRequests();
  }, [user]);

  const loadFriendsAndRequests = async () => {
    if (!user) return;

    try {
      const userDoc = await getDoc(doc(db, 'users', user.id));
      const userData = userDoc.data() as User;

      // Load incoming requests
      if (userData.friendRequests?.incoming?.length > 0) {
        const incomingUsers = await Promise.all(
          userData.friendRequests.incoming.map(async (userId) => {
            const userDoc = await getDoc(doc(db, 'users', userId));
            return { id: userDoc.id, ...userDoc.data() } as FriendRequestUser;
          })
        );
        setIncomingRequests(incomingUsers);
      }

      // Load outgoing requests
      if (userData.friendRequests?.outgoing?.length > 0) {
        const outgoingUsers = await Promise.all(
          userData.friendRequests.outgoing.map(async (userId) => {
            const userDoc = await getDoc(doc(db, 'users', userId));
            return { id: userDoc.id, ...userDoc.data() } as FriendRequestUser;
          })
        );
        setOutgoingRequests(outgoingUsers);
      }

      // Load friends
      if (userData.friends?.length > 0) {
        const friendUsers = await Promise.all(
          userData.friends.map(async (userId) => {
            const userDoc = await getDoc(doc(db, 'users', userId));
            return { id: userDoc.id, ...userDoc.data() } as FriendRequestUser;
          })
        );
        setFriends(friendUsers);
      }
    } catch (error) {
      console.error('Error loading friends and requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const normalizedQuery = searchQuery.toLowerCase().trim();

      // Search by username
      let q;
      if (normalizedQuery.startsWith('@')) {
        const username = normalizedQuery.slice(1);
        q = query(
          collection(db, 'users'),
          where('username', '==', username)
        );
      } else {
        q = query(
          collection(db, 'users'),
          where('username', '==', normalizedQuery)
        );
      }

      const querySnapshot = await getDocs(q);
      const results = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as User))
        .filter(u => u.id !== user?.id); // Exclude current user

      setSearchResults(results);

      if (results.length === 0) {
        toast.error('No users found with that username');
      }
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search for users');
    } finally {
      setSearching(false);
    }
  };

  const sendFriendRequest = async (targetUsername: string) => {
    try {
      const sendRequest = httpsCallable(functions, 'sendFriendRequest');
      await sendRequest({ targetUsername });
      toast.success('Friend request sent!');
      setSearchResults([]);
      setSearchQuery('');
      await loadFriendsAndRequests();
    } catch (error: any) {
      console.error('Error sending friend request:', error);
      toast.error(error.message || 'Failed to send friend request');
    }
  };

  const acceptFriendRequest = async (fromUserId: string) => {
    try {
      const acceptRequest = httpsCallable(functions, 'acceptFriendRequest');
      await acceptRequest({ fromUserId });
      toast.success('Friend request accepted!');
      await loadFriendsAndRequests();
    } catch (error: any) {
      console.error('Error accepting friend request:', error);
      toast.error(error.message || 'Failed to accept friend request');
    }
  };

  const declineFriendRequest = async (fromUserId: string) => {
    try {
      const declineRequest = httpsCallable(functions, 'declineFriendRequest');
      await declineRequest({ fromUserId });
      toast.success('Friend request declined');
      await loadFriendsAndRequests();
    } catch (error: any) {
      console.error('Error declining friend request:', error);
      toast.error(error.message || 'Failed to decline friend request');
    }
  };

  const removeFriend = async (friendId: string) => {
    try {
      const removeFriendFunc = httpsCallable(functions, 'removeFriend');
      await removeFriendFunc({ friendId });
      toast.success('Friend removed');
      await loadFriendsAndRequests();
    } catch (error: any) {
      console.error('Error removing friend:', error);
      toast.error(error.message || 'Failed to remove friend');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Friends
        </CardTitle>
        <CardDescription>Connect with friends and compete on the leaderboard</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends">
              Friends {friends.length > 0 && `(${friends.length})`}
            </TabsTrigger>
            <TabsTrigger value="requests">
              Requests {incomingRequests.length > 0 && `(${incomingRequests.length})`}
            </TabsTrigger>
            <TabsTrigger value="search">
              <Search className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="space-y-4 mt-4">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : friends.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No friends yet. Search for users to add!
              </div>
            ) : (
              friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {friend.photoURL ? (
                      <img
                        src={friend.photoURL}
                        alt={friend.displayName}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#6fb168] text-white flex items-center justify-center font-semibold">
                        {friend.displayName[0]}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{friend.displayName}</p>
                      <p className="text-sm text-gray-500">@{friend.username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Level {friend.level}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFriend(friend.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-4 mt-4">
            {incomingRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">No pending requests</div>
            ) : (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Incoming Requests</h4>
                {incomingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                  >
                    <div className="flex items-center gap-3">
                      {request.photoURL ? (
                        <img
                          src={request.photoURL}
                          alt={request.displayName}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#6fb168] text-white flex items-center justify-center font-semibold">
                          {request.displayName[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{request.displayName}</p>
                        <p className="text-sm text-gray-500">@{request.username}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => acceptFriendRequest(request.id)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => declineFriendRequest(request.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {outgoingRequests.length > 0 && (
              <div className="space-y-3 mt-6">
                <h4 className="text-sm font-medium text-gray-700">Sent Requests</h4>
                {outgoingRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {request.photoURL ? (
                        <img
                          src={request.photoURL}
                          alt={request.displayName}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#6fb168] text-white flex items-center justify-center font-semibold">
                          {request.displayName[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{request.displayName}</p>
                        <p className="text-sm text-gray-500">@{request.username}</p>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">Pending</span>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="search" className="space-y-4 mt-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search by username (e.g., @john_doe)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={searching} className="bg-[#6fb168] hover:bg-[#5a9a54]">
                {searching ? 'Searching...' : 'Search'}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-3">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {result.photoURL ? (
                        <img
                          src={result.photoURL}
                          alt={result.displayName}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#6fb168] text-white flex items-center justify-center font-semibold">
                          {result.displayName[0]}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{result.displayName}</p>
                        <p className="text-sm text-gray-500">@{result.username}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => sendFriendRequest(result.username)}
                      className="bg-[#6fb168] hover:bg-[#5a9a54]"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Friend
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
