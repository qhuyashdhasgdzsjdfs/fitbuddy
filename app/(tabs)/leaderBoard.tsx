// app/(tabs)/leaderboard.tsx

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  collection, getDocs, getFirestore, query, where,
} from "firebase/firestore";
import { useCallback, useState } from "react";
import {
  ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View,
} from "react-native";
import { usePedometer } from "@/hooks/usePedometer";

function getDb() { return getFirestore(getApp()); }
function todayStr() { return new Date().toISOString().split("T")[0]; }

interface LBEntry { userId:string; displayName:string; steps:number; date:string; }

async function fetchLeaderboard(): Promise<LBEntry[]> {
  const snap = await getDocs(query(collection(getDb(),"leaderboard"), where("date","==",todayStr())));
  return snap.docs.map(d=>d.data() as LBEntry).sort((a,b)=>b.steps-a.steps);
}

const MEDALS = ["🥇","🥈","🥉"];
const COLORS  = ["#F59E0B","#9CA3AF","#B45309"];

export default function LeaderboardScreen() {
  const [entries,   setEntries]   = useState<LBEntry[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);

  const { steps }  = usePedometer();
  const myUid      = getAuth(getApp()).currentUser?.uid;

  const load = useCallback(async () => {
    try {
      const data = await fetchLeaderboard();
      setEntries(data);
    } catch(e){console.error("LB:",e);}
    finally{setLoading(false);}
  },[]);

  useFocusEffect(useCallback(()=>{ load(); },[load]));

  const list = entries.map(e => e.userId===myUid ? {...e, steps:Math.max(e.steps,steps)} : e)
    .sort((a,b)=>b.steps-a.steps);

  const myRank = list.findIndex(e=>e.userId===myUid)+1;

  return (
    <ScrollView
      style={s.screen} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async()=>{setRefreshing(true);await load();setRefreshing(false);}} tintColor="#F59E0B"/>}
    >
      <View style={s.header}>
        <Text style={s.title}>🏆 Bảng xếp hạng</Text>
        <Text style={s.subtitle}>{new Date().toLocaleDateString("vi-VN",{day:"numeric",month:"long"})}</Text>
      </View>

      {myRank>0 && (
        <View style={s.myRankCard}>
          <Ionicons name="person-circle-outline" size={28} color="#F59E0B"/>
          <View style={{flex:1}}>
            <Text style={s.myRankLabel}>Vị trí của bạn</Text>
            <Text style={s.myRankSub}>{steps.toLocaleString()} bước hôm nay</Text>
          </View>
          <View style={s.myRankBadge}>
            <Text style={s.myRankNum}>#{myRank}</Text>
          </View>
        </View>
      )}

      {loading
        ? <ActivityIndicator size="large" color="#F59E0B" style={{marginTop:40}}/>
        : list.length===0
          ? <View style={s.empty}>
              <Text style={s.emptyIcon}>👣</Text>
              <Text style={s.emptyText}>Chưa có ai lên bảng hôm nay</Text>
              <Text style={s.emptySub}>Lưu hoạt động tại tab Vận động để lên bảng</Text>
            </View>
          : <>
              {/* Podium top 3 */}
              {list.length>=3 && (
                <View style={s.podium}>
                  {[list[1],list[0],list[2]].map((e,i)=>{
                    const rank=[2,1,3][i], h=[100,130,90][i];
                    return (
                      <View key={e.userId} style={[s.podiumCol,{height:h+60}]}>
                        <Text style={s.podiumEmoji}>{MEDALS[rank-1]}</Text>
                        <Text style={s.podiumName} numberOfLines={1}>{e.displayName}</Text>
                        <Text style={s.podiumSteps}>{e.steps.toLocaleString()}</Text>
                        <View style={[s.podiumBlock,{height:h,backgroundColor:COLORS[rank-1]+"22",borderTopColor:COLORS[rank-1]}]}>
                          <Text style={[s.podiumRank,{color:COLORS[rank-1]}]}>#{rank}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Full list */}
              <Text style={s.sectionTitle}>Tất cả</Text>
              {list.map((e,i)=>{
                const isMe=e.userId===myUid;
                const pct=list[0]?.steps>0?e.steps/list[0].steps:0;
                return (
                  <View key={e.userId} style={[s.row, isMe&&s.rowMe]}>
                    <Text style={[s.rank, i<3&&{color:COLORS[i]}]}>{i<3?MEDALS[i]:`${i+1}`}</Text>
                    <View style={[s.avatar,{backgroundColor: isMe?"#F59E0B":"#E5E7EB"}]}>
                      <Text style={[s.avatarText,{color:isMe?"#fff":"#6B7280"}]}>
                        {e.displayName.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{flex:1}}>
                      <Text style={[s.name, isMe&&{color:"#F59E0B"}]}>{e.displayName}{isMe?" (Bạn)":""}</Text>
                      <View style={s.barBg}>
                        <View style={[s.barFill,{width:`${pct*100}%`,backgroundColor:isMe?"#F59E0B":i<3?COLORS[i]:"#D1D5DB"}]}/>
                      </View>
                    </View>
                    <Text style={[s.steps, isMe&&{color:"#F59E0B"}]}>{e.steps.toLocaleString()}</Text>
                  </View>
                );
              })}
            </>
      }
    </ScrollView>
  );
}

const s = StyleSheet.create({
  screen:       {flex:1,backgroundColor:"#FFFBF0"},
  content:      {paddingHorizontal:20,paddingTop:60,paddingBottom:40},
  header:       {marginBottom:20},
  title:        {fontSize:28,fontWeight:"900",color:"#111827"},
  subtitle:     {fontSize:13,color:"#9CA3AF",marginTop:3},
  myRankCard:   {flexDirection:"row",alignItems:"center",gap:12,backgroundColor:"#FEF3C7",borderRadius:16,padding:16,marginBottom:20,borderWidth:1.5,borderColor:"#FCD34D"},
  myRankLabel:  {fontSize:14,fontWeight:"700",color:"#92400E"},
  myRankSub:    {fontSize:12,color:"#B45309",marginTop:2},
  myRankBadge:  {backgroundColor:"#F59E0B",borderRadius:12,paddingHorizontal:12,paddingVertical:4},
  myRankNum:    {fontSize:18,fontWeight:"900",color:"#fff"},
  empty:        {alignItems:"center",paddingTop:60,gap:8},
  emptyIcon:    {fontSize:48},
  emptyText:    {fontSize:16,fontWeight:"700",color:"#374151"},
  emptySub:     {fontSize:13,color:"#9CA3AF",textAlign:"center"},
  podium:       {flexDirection:"row",alignItems:"flex-end",justifyContent:"center",gap:8,marginBottom:24,height:220},
  podiumCol:    {width:100,alignItems:"center",justifyContent:"flex-end"},
  podiumEmoji:  {fontSize:28,marginBottom:4},
  podiumName:   {fontSize:11,fontWeight:"700",color:"#374151",marginBottom:2,textAlign:"center"},
  podiumSteps:  {fontSize:11,color:"#6B7280",marginBottom:4},
  podiumBlock:  {width:"100%",borderRadius:12,borderTopWidth:3,justifyContent:"center",alignItems:"center"},
  podiumRank:   {fontSize:20,fontWeight:"900",marginTop:8},
  sectionTitle: {fontSize:15,fontWeight:"700",color:"#111827",marginBottom:12},
  row:          {flexDirection:"row",alignItems:"center",gap:10,backgroundColor:"#fff",borderRadius:14,padding:14,marginBottom:8,elevation:1,shadowColor:"#000",shadowOffset:{width:0,height:1},shadowOpacity:0.04,shadowRadius:3},
  rowMe:        {borderWidth:1.5,borderColor:"#FCD34D",backgroundColor:"#FFFBF0"},
  rank:         {fontSize:16,fontWeight:"800",width:28,textAlign:"center",color:"#9CA3AF"},
  avatar:       {width:36,height:36,borderRadius:18,justifyContent:"center",alignItems:"center"},
  avatarText:   {fontSize:15,fontWeight:"700"},
  name:         {fontSize:14,fontWeight:"700",color:"#111827",marginBottom:4},
  barBg:        {height:4,backgroundColor:"#F3F4F6",borderRadius:4,overflow:"hidden"},
  barFill:      {height:"100%",borderRadius:4},
  steps:        {fontSize:14,fontWeight:"800",color:"#374151",minWidth:60,textAlign:"right"},
});